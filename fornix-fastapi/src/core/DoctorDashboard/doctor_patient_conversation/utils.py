from __future__ import annotations

import io
import subprocess
from pathlib import Path
from pydub import AudioSegment  # type: ignore
from typing import Generator, TYPE_CHECKING
from itertools import islice
import os
from loguru import logger
from fastapi import HTTPException
from .errors import UnsupportedFileTypeError
from io import BytesIO
from tempfile import NamedTemporaryFile

import tempfile
import aiofiles  # type: ignore
import json
import yaml  # type: ignore

if TYPE_CHECKING:
    from _typeshed import ReadableBuffer


def split_audio_file(
        audio_source: str | bytes,
        chunk_length_minutes: int = 10,
        filename: str = "file.mp3",
        export_format: str = "mp3",
) -> Generator[NamedBytesIO, None, None]:

    if isinstance(audio_source, str):
        try:
            audio = AudioSegment.from_file(audio_source)
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            raise UnsupportedFileTypeError(f"Unsupported file type: {audio_source}")
    else:
        try:
            audio = AudioSegment.from_file(BytesIO(audio_source))
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            raise UnsupportedFileTypeError("Unsupported file type")

    chunk_size_ms = chunk_length_minutes * 60 * 1000
    filename = f"{Path(filename).stem}.{export_format}"

    duration = len(audio)
    for i in range(0, duration, chunk_size_ms):
        chunk = audio[i : i + chunk_size_ms]
        chunk_io = NamedBytesIO(name=filename)
        chunk.export(chunk_io, format=export_format)
        chunk_io.seek(0)
        yield chunk_io


def save_chunks(
        chunks: Generator[AudioSegment, None, None], output_dir: str, file_name_prefix: str
):
    """
    Save audio chunks to separate files in the specified output directory.

    Args:
        chunks (Generator[AudioSegment, None, None]): A generator yielding audio chunks.
        output_dir (str): The path to the output directory where the chunk files will be saved.
        file_name_prefix (str): A prefix to be added to the chunk file names.

    Raises:
        FileNotFoundError: If the output directory does not exist.
    """
    if not os.path.isdir(output_dir):
        raise FileNotFoundError(f"Output directory not found: {output_dir}")

    for i, chunk in enumerate(chunks, start=1):
        output_file = os.path.join(output_dir, f"{file_name_prefix}_chunk_{i}.wav")
        logger.info(f"Saving chunk {i} to {output_file}")
        chunk.export(output_file, format="wav")


def save_in_memory(
        chunks: Generator[AudioSegment, None, None], file_format: str = "wav"
) -> Generator[BytesIO, None, None]:
    """
    Save audio chunks to separate files in the specified output directory.

    Args:
        chunks (Generator[AudioSegment, None, None]): A generator yielding audio chunks.
        output_dir (str): The path to the output directory where the chunk files will be saved.
        file_name_prefix (str): A prefix to be added to the chunk file names.

    Raises:
        FileNotFoundError: If the output directory does not exist.
    """
    for i, chunk in enumerate(chunks, start=1):
        output_file = f"chunk_{i}.{file_format}"
        byte_file = BytesIO()
        byte_file.name = output_file
        chunk.export(byte_file, format=file_format)
        byte_file.seek(0)
        yield byte_file


def save_bytesio_to_tempfile(bytesio, file_format="wav"):
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_format) as temp_file:
        temp_file.write(bytesio.getvalue())
        temp_file.close()
    return temp_file.name


async def save_transcript(transcript: list, filename: str):
    async with aiofiles.open(f"data/{filename}", "w") as f:
        if filename.endswith(".json"):
            data = json.dumps(transcript, indent=4)
            await f.write(data)
        else:
            data = yaml.dump(transcript)
            await f.write(data)


async def read_transcript(filename: str):
    async with aiofiles.open(f"data/{filename}", "r") as f:
        if filename.endswith(".json"):
            data = await f.read()
            transcript = json.loads(data)
        else:
            data = await f.read()
            transcript = yaml.safe_load(data)
    return transcript


def convert_audio_for_assemblyai(audio_bytes: bytes) -> bytes:
    try:
        audio_stream = io.BytesIO(audio_bytes)
        audio_stream.seek(0)
        audio = AudioSegment.from_file(audio_stream, format="webm")
        if audio.channels > 1:
            audio = audio.set_channels(1)

        # Set frame rate and sample width
        audio = audio.set_frame_rate(16000)
        audio = audio.set_sample_width(2)

        # Export to WAV format
        buffer = io.BytesIO()
        audio.export(buffer, format="wav")

        return buffer.getvalue()
    except Exception as e:
        print(f"Error converting audio: {e}")
        raise ValueError(f"Error converting audio: {e}")


def batched(iterable, n):
    if n < 1:
        raise ValueError("n must be at least one")
    iterator = iter(iterable)
    while batch := tuple(islice(iterator, n)):
        yield batch


class NamedBytesIO(BytesIO):
    def __init__(self, initial_bytes: "ReadableBuffer" = b"", *, name: str) -> None:
        super().__init__(initial_bytes)
        self._name = self._validate_name(name)

    def _validate_name(self, name: str) -> str:
        """Validate that the name has an extension."""
        _, ext = os.path.splitext(name)
        if not ext:
            raise ValueError("The name must include a file extension.")
        return name

    def __str__(self) -> str:
        return f"NamedBytesIO(name='{self.name}')"

    @property
    def name(self) -> str:
        return self._name

    @property
    def filetype(self) -> str:
        """Return the file extension."""
        return os.path.splitext(self.name)[1]



def flatten_dicts(dict_list):
    flattened_result = {}

    for current_dict in dict_list:
        for key, value in current_dict.items():
            if key in ["task", "language"] and key not in flattened_result:
                flattened_result[key] = value
            elif key == "duration":
                flattened_result[key] = flattened_result.get(key, 0) + value
            elif key == "text":
                flattened_result[key] = flattened_result.get(key, "") + value + " "
            elif key == "segments":
                if key not in flattened_result:
                    flattened_result[key] = []
                filtered_segments = [{sub_key: sub_value for sub_key, sub_value in segment.items()
                                      if sub_key in ["start", "end", "text"]}
                                     for segment in value]
                flattened_result[key].extend(filtered_segments)
    if 'text' in flattened_result:
        flattened_result['text'] = flattened_result['text'].strip()

    return flattened_result

def flatten_dict(data: dict) -> dict:
    flattened_result = {}

    for key, value in data.items():
        if key in ["task", "language"]:
            flattened_result[key] = value

        elif key == "duration":
            # Just copy since we only have one dict
            flattened_result[key] = value

        elif key == "text":
            flattened_result[key] = value.strip() if isinstance(value, str) else value

        elif key == "segments":
            filtered_segments = [
                {sub_key: sub_value for sub_key, sub_value in segment.items()
                 if sub_key in ["start", "end", "text"]}
                for segment in value
            ]
            flattened_result[key] = filtered_segments

    return flattened_result


def fast_split_audio(input_bytes: bytes, suffix: str, segment_duration: int = 60) -> list[NamedBytesIO]:

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(input_bytes)
            tmp.flush()
            tmp_path = Path(tmp.name)

        if suffix != ".wav":
            segment_pattern = tmp_path.parent / f"segment_%03d{suffix}"
            logger.info(f"Non wave file detected using suffix: {suffix}")
            command = [
                "ffmpeg",
                "-y",
                "-i", str(tmp_path),
                "-f", "segment",
                "-segment_time", str(segment_duration),
                "-c", "copy",
                str(segment_pattern),
                "-loglevel", "quiet"
            ]
        else:
            suffix = ".ogg"
            segment_pattern = tmp_path.parent / f"segment_%03d{suffix}"
            logger.info(f"wave file detected using {suffix}")
            command = [
                "ffmpeg",
                "-y",
                "-i", str(tmp_path),
                "-f", "segment",
                "-segment_time", str(segment_duration),
                str(segment_pattern),
                "-loglevel", "quiet"
            ]


        proc = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        tmp_path.unlink()

        if proc.returncode != 0:
            raise HTTPException(500, detail=f"FFmpeg failed:\n{proc.stderr.decode()}")

        segments = []
        for file in sorted(tmp_path.parent.glob(f"segment_*{suffix}")):
            bio = NamedBytesIO(name=file.name)
            with open(file, "rb") as f:
                bio.write(f.read())
            bio.seek(0)
            segments.append(bio)
            file.unlink()

        return segments
    except Exception as e:
        logger.error(f"Error splitting audio: {e}")
        raise HTTPException(500, detail=str(e))
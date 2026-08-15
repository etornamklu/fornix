// utils/convertToWav.ts
export async function convertBlobToWav(original: Blob): Promise<Blob> {
    // 1) Decode the original Blob into an AudioBuffer
    const arrayBuffer = await original.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // 2) Grab the samples (mono)
    const channelData = audioBuffer.numberOfChannels > 1
        ? mixDown(audioBuffer)
        : audioBuffer.getChannelData(0);

    // 3) Encode a WAV file
    const wavArrayBuffer = encodeWAV(channelData, audioBuffer.sampleRate);
    return new Blob([wavArrayBuffer], { type: "audio/wav" });
}

function mixDown(buffer: AudioBuffer): Float32Array {
    const len = buffer.length;
    const result = new Float32Array(len);
    const channels = buffer.numberOfChannels;
    for (let ch = 0; ch < channels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < len; i++) {
            result[i] = (result[i] || 0) + data[i] / channels;
        }
    }
    return result;
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const bytesPerSample = 2;
    const blockAlign = bytesPerSample * 1; // mono
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const dv = new DataView(buffer);

    /* RIFF header */
    writeString(dv, 0, "RIFF");
    dv.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(dv, 8, "WAVE");

    /* fmt chunk */
    writeString(dv, 12, "fmt ");
    dv.setUint32(16, 16, true);              // chunk length
    dv.setUint16(20, 1, true);               // PCM format
    dv.setUint16(22, 1, true);               // channels
    dv.setUint32(24, sampleRate, true);      // sample rate
    dv.setUint32(28, sampleRate * blockAlign, true); // byte rate
    dv.setUint16(32, blockAlign, true);
    dv.setUint16(34, bytesPerSample * 8, true);

    /* data chunk */
    writeString(dv, 36, "data");
    dv.setUint32(40, samples.length * bytesPerSample, true);

    /* PCM samples */
    floatTo16BitPCM(dv, 44, samples);

    return buffer;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(dv: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        dv.setUint8(offset + i, str.charCodeAt(i));
    }
}

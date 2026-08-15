let audioContext;
let mediaStream;
let recorder;
let websocket;
let audioChunks = [];

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const statusDiv = document.getElementById('status');
    const waveContainer = document.querySelector('.wave-container');
    const partialTranscriptDiv = document.getElementById('partialTranscript');
    const finalTranscriptDiv = document.getElementById('finalTranscript');
    const reportContentDiv = document.getElementById('reportContent');
    const rawTranscriptDiv = document.getElementById('rawTranscript');
    const rawTranscriptCheckbox = document.getElementById('rawTranscriptCheckbox');

    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    generateReportBtn.addEventListener('click', generateReport);

    async function startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('getUserMedia is not supported in your browser');
            return;
        }

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            const source = audioContext.createMediaStreamSource(mediaStream);
            
            recorder = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
            source.connect(recorder);
            recorder.connect(audioContext.destination);

            websocket = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');

            websocket.onopen = () => {
                statusDiv.textContent = 'WebSocket connected';
                startRecordingUI();
            };

            websocket.onclose = () => {
                statusDiv.textContent = 'WebSocket disconnected';
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                statusDiv.textContent = 'WebSocket error';
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'partial_transcript') {
                    partialTranscriptDiv.textContent = data.text;
                } else if (data.type === 'final_transcript') {
                    finalTranscriptDiv.innerHTML += data.text + '<br>';
                    partialTranscriptDiv.textContent = '';
                }
            };

            recorder.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16Array = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16Array[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[i] * 32767)));
                }
                audioChunks.push(int16Array);
                
                if (websocket.readyState === WebSocket.OPEN) {
                    websocket.send(int16Array.buffer);
                }
            };

        } catch (err) {
            console.error('Error accessing the microphone', err);
            alert('Error accessing the microphone: ' + err.message);
        }
    }

    function startRecordingUI() {
        audioChunks = [];
        statusDiv.textContent = 'Recording started...';
        statusDiv.style.color = '#007bff';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        generateReportBtn.disabled = true;
        waveContainer.style.display = 'flex';
        partialTranscriptDiv.textContent = '';
        finalTranscriptDiv.innerHTML = '';
        reportContentDiv.innerHTML = '';
        rawTranscriptDiv.innerHTML = '';
    }

    function stopRecording() {
        if (recorder) {
            recorder.disconnect();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.close();
        }

        statusDiv.textContent = 'Recording stopped';
        statusDiv.style.color = '#333';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        generateReportBtn.disabled = false;
        waveContainer.style.display = 'none';

        // Create and download WAV file
        const wavBlob = createWavBlob(audioChunks);
        const audioUrl = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'recording.wav';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function generateReport() {
        const formData = new FormData();
        const wavBlob = createWavBlob(audioChunks);
        formData.append('file', wavBlob, 'recording.wav');
        formData.append('return_raw', rawTranscriptCheckbox.checked);

        try {
            const response = await fetch('/report', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let reportContent = '';
            let rawTranscript = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.stream) {
                            reportContent += data.stream;
                            updateReportContent(reportContent);
                        } else if (data.raw_transcript) {
                            rawTranscript = data.raw_transcript;
                            updateRawTranscript(rawTranscript);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }

            // Final update after streaming is complete
            updateReportContent(reportContent, true);
            updateRawTranscript(rawTranscript);

        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating report: ' + error.message);
        }
    }

    function updateReportContent(content, isFinal = false) {
        if (isFinal) {
            try {
                const jsonContent = JSON.parse(content);
                const yamlContent = jsyaml.dump(jsonContent);
                reportContentDiv.innerHTML = highlightYaml(yamlContent);
            } catch (e) {
                console.error('Error parsing final report content:', e);
                reportContentDiv.textContent = content;
            }
        } else {
            reportContentDiv.textContent = content;
        }
    }

    function updateRawTranscript(content) {
        if (content) {
            try {
                const jsonContent = JSON.parse(content);
                const yamlContent = jsyaml.dump(jsonContent);
                rawTranscriptDiv.innerHTML = highlightYaml(yamlContent);
            } catch (e) {
                console.error('Error parsing raw transcript:', e);
                rawTranscriptDiv.textContent = content;
            }
        }
    }

    function highlightYaml(yaml) {
        return yaml.replace(/^(\s*)(.+?):/gm, '$1<span class="yaml-key">$2</span>:')
                   .replace(/: (.+)$/gm, ': <span class="yaml-value">$1</span>');
    }

    function createWavBlob(audioChunks) {
        const wavHeader = createWavHeader(audioChunks.length * 2);
        const audioData = new Uint8Array(wavHeader.length + audioChunks.length * 2);
        audioData.set(new Uint8Array(wavHeader), 0);
        let offset = wavHeader.length;
        for (let chunk of audioChunks) {
            audioData.set(new Uint8Array(chunk.buffer), offset);
            offset += chunk.length * 2;
        }
        return new Blob([audioData], { type: 'audio/wav' });
    }

    function createWavHeader(dataLength) {
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, SAMPLE_RATE, true);
        view.setUint32(28, SAMPLE_RATE * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        return buffer;
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
});
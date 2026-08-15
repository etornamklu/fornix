let audioContext;
let mediaStream;
let recorder;
let websocket;
let audioChunks = [];
let audioQueue = [];
let isPlaying = false;

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusDiv = document.getElementById('status');
    const waveContainer = document.querySelector('.wave-container');
    const conversationDiv = document.getElementById('conversation');
    const audioPlayer = document.getElementById('audioPlayer');

    startBtn.addEventListener('click', startConversation);
    stopBtn.addEventListener('click', stopConversation);
    audioPlayer.addEventListener('ended', playNextAudio);

    async function startConversation() {
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

            const threadId = Math.random().toString(36).substring(7);
            const patientId = generateUUID();

            websocket = new WebSocket(`ws://localhost:8000/ws/chat/${threadId}/${patientId}`);

            websocket.onopen = () => {
                statusDiv.textContent = 'Connected to AI';
                startRecordingUI();
            };

            websocket.onclose = () => {
                statusDiv.textContent = 'Disconnected from AI';
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                statusDiv.textContent = 'Connection error';
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'transcript') {
                    updateConversation('patient', data.text);
                } else if (data.type === 'ai_response') {
                    updateConversation('ai', data.text);
                } else if (data.type === 'audio') {
                    const audioBlob = new Blob([data.audio], { type: 'audio/wav' });
                    audioQueue.push(URL.createObjectURL(audioBlob));
                    if (!isPlaying) {
                        playNextAudio();
                    }
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
        statusDiv.textContent = 'Conversation started...';
        statusDiv.style.color = '#007bff';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        waveContainer.classList.add('recording');
        conversationDiv.innerHTML = '';
    }

    function stopConversation() {
        if (recorder) {
            recorder.disconnect();
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.close();
        }

        statusDiv.textContent = 'Conversation ended';
        statusDiv.style.color = '#333';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        waveContainer.classList.remove('recording');
    }

    function updateConversation(speaker, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', speaker);
        messageDiv.textContent = `${speaker.charAt(0).toUpperCase() + speaker.slice(1)}: ${text}`;
        conversationDiv.appendChild(messageDiv);
        conversationDiv.scrollTop = conversationDiv.scrollHeight;
    }

    function playNextAudio() {
        if (audioQueue.length > 0) {
            const audioUrl = audioQueue.shift();
            audioPlayer.src = audioUrl;
            audioPlayer.play();
            isPlaying = true;
        } else {
            isPlaying = false;
        }
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});
document.getElementById('addText').addEventListener('click', () => {
    const text = prompt('Enter your text:');
    if (text) {
        const textElement = document.createElement('div');
        textElement.className = 'text';
        textElement.textContent = text;
        textElement.style.left = '50px';
        textElement.style.top = '50px';
        textElement.classList.add('fade-in'); // Add animation class
        document.getElementById('canvas').appendChild(textElement);
    }
});

document.getElementById('imageInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.className = 'image fade-in'; // Add animation class
            imgElement.style.left = '100px';
            imgElement.style.top = '100px';
            document.getElementById('canvas').appendChild(imgElement);
        };
        reader.readAsDataURL(file);
    }
});

let frames = [];
let recording = false;
const fps = 30;

document.getElementById('startRecording').addEventListener('click', () => {
    frames = [];
    recording = true;
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
    captureFrame();
});

document.getElementById('stopRecording').addEventListener('click', async () => {
    recording = false;
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
    await createVideo();
});

function captureFrame() {
    if (!recording) return;

    html2canvas(document.getElementById('canvas')).then(canvas => {
        frames.push(canvas.toDataURL('image/png'));
        setTimeout(captureFrame, 1000 / fps); // Capture at 30 FPS
    });
}

async function createVideo() {
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    await ffmpeg.load();

    // Write all frames to the FFmpeg file system
    for (let i = 0; i < frames.length; i++) {
        await ffmpeg.FS('writeFile', `frame${i}.png`, await fetchFile(frames[i]));
    }

    // Run FFmpeg command to create video
    await ffmpeg.run('-r', `${fps}`, '-i', 'frame%d.png', '-vcodec', 'libx264', 'output.mp4');

    // Read the output file
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const videoUrl = URL.createObjectURL(videoBlob);

    // Create a download link for the video
    const downloadLink = document.createElement('a');
    downloadLink.href = videoUrl;
    downloadLink.download = 'animation.mp4';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Cleanup
    frames = [];
    await ffmpeg.exit();
}

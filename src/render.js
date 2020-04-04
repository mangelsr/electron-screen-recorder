const videoElement = document.querySelector('video');

const btnStart = document.getElementById('btnStart');
btnStart.onclick = e => {
    mediaRecorder.start();
    btnStart.classList.add('is-danger');
    btnStart.innerText = 'Recording';
};

const btnStop = document.getElementById('btnStop');
btnStop.onclick = e => {
    mediaRecorder.stop();
    btnStart.classList.remove('is-danger');
    btnStart.innerText = 'Start';
};


const btnVideoSelect = document.getElementById('btnVideoSelect');
btnVideoSelect.onclick = getVideoSources;

const {
    desktopCapturer,
    remote
} = require('electron');
const {
    Menu
} = remote;

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });
    const videoOptionMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    );
    videoOptionMenu.popup();
}

let mediaRecorder;
const recordedChunks = [];

async function selectSource(source) {
    btnVideoSelect.innerHTML = source.name;
    const constrains = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };
    const stream = await navigator.mediaDevices
        .getUserMedia(constrains);
    videoElement.srcObject = stream;
    videoElement.play();

    const options = {
        mimeType: 'video/webm; codecs=vp9'
    };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

const {
    dialog
} = remote;
const {
    writeFile
} = require('fs');

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const {
        filePath
    } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });
    console.log(filePath);
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
}
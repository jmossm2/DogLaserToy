
let host = document.location.origin;

let view;
let viewSelector;
let stream;

function loadMobileView() {
    view.classList.add('mobile');
    let streamContainer = document.createElement('div');
    streamContainer.setAttribute('class', 'stream-container');
    stream = document.createElement('img');
    stream.setAttribute('id', 'stream');
    streamContainer.appendChild(stream);
    view.appendChild(streamContainer);

    let laserSwitch = document.createElement('div');
    laserSwitch.setAttribute('class', 'laser-switch');
    view.appendChild(laserSwitch);

    laserSwitch.addEventListener('touchstart', turnOnLaser);
    laserSwitch.addEventListener('touchend', turnOffLaser);

    startStream();

    viewSelector.classList.add('hidden');
}

function loadDesktopView() {
    view.classList.add('desktop');

    viewSelector.classList.add('hidden');
}

function startStream() {
    if (!stream) return;
    stream.src = `${host}/stream`;
}
function stopStream() {
    window.stop();
}

function turnOnLaser(e) {
    e.preventDefault();
    e.target.classList.add('pressed');

    fetch('/laser', {
        method: 'POST',
        body: 'on'
    });
}

function turnOffLaser(e) {
    e.preventDefault();
    e.target.classList.remove('pressed');
    fetch('/laser', {
        method: 'POST',
        body: 'off'
    });
}

document.addEventListener('DOMContentLoaded', (e) => {
    view = document.getElementById('view');
    viewSelector = document.getElementById('view-selector');

    document.getElementById('mobile-selector').addEventListener('click', loadMobileView);
    document.getElementById('desktop-selector').addEventListener('click', loadDesktopView);
});


// document.addEventListener('DOMContentLoaded', (e) => {
//     var baseHost = document.location.origin;
//     // var streamUrl = baseHost + ':81'

//     const view = document.getElementById('stream');
//     const viewContainer = document.getElementById('stream-container');

//     function startStream() {
//         view.src = `${baseHost}/stream`;
//     }
//     function stopStream() {
//         window.stop();
//     }

//     startStream();
// });
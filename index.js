let clipPath = '';
function generateWave() {
    const width_px = +document.querySelector('#width').value;
    const height_px = +document.querySelector('#height').value;
    const offset = +document.querySelector('#offset').value;
    const amplitude = +document.querySelector('#amplitude').value;
    const frequency = +document.querySelector('#frequency').value;
    const phase = +document.querySelector('#phase').value;
    const points = +document.querySelector('#points').value;
    const inverted = document.querySelector('#inverted').checked;
    const units = 2 * Math.PI * frequency / points;
    const path = 'clip-path: polygon(100% 100%, 0% 100% ';
    const invertedpath = 'clip-path: polygon(100% 0%, 0% 0% ';

    let clipPathString = path;
    if (inverted) clipPathString = invertedpath;

    let radPhase = phase * Math.PI / 180;

    for (let i = 0; i <= points; i++) {
        let val = offset + amplitude * Math.cos(i * units + radPhase);
        let valY = (val / height_px * 100).toFixed(2);
        let valX = (i * 100 / points).toFixed(2);
        clipPathString += ', ' + valX + '% ' + valY + '%';
    }
    clipPathString += ');';

    clipPath = clipPathString;
    let divEl = document.getElementById('wave-container');
    divEl.style = `width:${width_px}px;height:${height_px}px; ` + clipPathString;
    getClipPath();
}

function getClipPath() {
    let divEl = document.getElementById('result');
    divEl.style = 'display: block';
    divEl.textContent = clipPath;

    const copyButton = document.getElementById('copyButton');
    copyButton.style = 'display: block;';
    let controls = document.getElementById('controls');
}

function copyToClipBoard() {
    navigator.clipboard.writeText(clipPath);
    let messageEl = document.getElementById('message');
    messageEl.style = 'display: block;';

    setTimeout(() => {
        messageEl.style = 'display: none;';
    }, 3000);
}
(() => {
    generateWave();
})();
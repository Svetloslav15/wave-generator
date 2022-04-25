let clipPath = '';
function generateWave() {
    const width_px = +document.getElementById('width').value;
    const height_px = +document.getElementById('height').value;
    const offset = +document.getElementById('offset').value;
    const amplitude = +document.getElementById('amplitude').value;
    const frequency = +document.getElementById('frequency').value;
    const phase = +document.querySelector('#phase').value;
    const points = +document.querySelector('#points').value;
    const units = frequency * width_px / 100;

    let clipPathString = 'clip-path: polygon(100% 0%, 0% 0% ';
    let radPhase = phase * Math.PI / 180;

    for (let i = 0; i <= points; i++) {
        let val = offset + amplitude * Math.cos(i / units + radPhase);
        val = (val / height_px * 100).toFixed(2);
        clipPathString += ', ' + i + '% ' + val + '%';
    }
    clipPathString += ');';

    clipPath = clipPathString;
    let divEl = document.getElementById('wave-container');
    divEl.style = `width:${width_px}px;height:${height_px}px; ` + 'background-color:#ED4545; transform: rotate(180deg); ' + clipPathString;
    getClipPath();
}

function getClipPath() {
    let divEl = document.getElementById('result');
    divEl.style = 'display: block';
    divEl.textContent = clipPath;

    const copyButton = document.getElementById('copyButton');
    copyButton.style = 'display: block;';
    let container = document.getElementById('container');
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

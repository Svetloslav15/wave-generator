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
    const waveColor = document.getElementById('waveColor').value;
    const displayArea = document.getElementById('display-area');
    const maxWidth = displayArea ? displayArea.clientWidth : width_px;
    const renderWidth = Math.min(width_px, maxWidth);
    const scale = renderWidth / width_px;
    const renderHeight = Math.round(height_px * scale);
    divEl.style = `width:${renderWidth}px;height:${renderHeight}px;background-color:${waveColor}; ` + clipPathString;
    getClipPath();
}

function getClipPath() {
    let divEl = document.getElementById('result');
    divEl.style = 'display: block';
    divEl.textContent = clipPath;
}

function syncInput(id, value) {
    document.getElementById(id).value = value;
    generateWave();
}

function syncRange(id, value) {
    document.getElementById(id + '-range').value = value;
    generateWave();
}

function updateWaveColor(color) {
    document.getElementById('wave-container').style.backgroundColor = color;
}

function randomizeWave() {
    const fields = [
        { id: 'width', min: 300, max: 900 },
        { id: 'height', min: 100, max: 500 },
        { id: 'offset', min: 50, max: 300 },
        { id: 'amplitude', min: 30, max: 250 },
        { id: 'frequency', min: 0.5, max: 5, step: 0.1 },
        { id: 'phase', min: 0, max: 180, step: 5 },
        { id: 'points', min: 10, max: 100, step: 5 },
    ];

    fields.forEach(function(field) {
        let val;
        if (field.step) {
            const steps = Math.floor((field.max - field.min) / field.step);
            val = field.min + Math.floor(Math.random() * steps) * field.step;
            val = parseFloat(val.toFixed(2));
        } else {
            val = Math.floor(Math.random() * (field.max - field.min)) + field.min;
        }
        document.getElementById(field.id).value = val;
        document.getElementById(field.id + '-range').value = val;
    });

    generateWave();
}

function copyToClipBoard() {
    navigator.clipboard.writeText(clipPath);

    const btn = document.getElementById('copyButton');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-success');

    setTimeout(function() {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
    }, 2000);
}

(function() {
    generateWave();
    window.addEventListener('resize', generateWave);
})();

let clipPath = '';

const UNIT_HINTS = {
    '%': 'The wave stretches with the element\'s width and height.',
    'px': 'The wave keeps its pixel depth on any element height. Width still stretches.',
    'vw': 'The wave scales with the page width and keeps its shape. Use on full-width sections.',
};

// Phase that puts a crest (or a trough when inverted) in the middle of the width.
function centeredPhase(frequency, inverted) {
    const target = inverted ? 0 : 180;
    return (((target - 180 * frequency) % 360) + 360) % 360;
}

// Formats a y coordinate (px from the top of a width x height box) in the chosen unit.
// px and vw are measured from the edge the wave belongs to, so the depth stays fixed.
function formatY(y, width, height, inverted, unit) {
    if (unit === 'px') {
        return inverted ? `calc(100% - ${(height - y).toFixed(2)}px)` : `${y.toFixed(2)}px`;
    }
    if (unit === 'vw') {
        return inverted
            ? `calc(100% - ${((height - y) / width * 100).toFixed(2)}vw)`
            : `${(y / width * 100).toFixed(2)}vw`;
    }
    return (y / height * 100).toFixed(2) + '%';
}

function generateWave() {
    const width_px = +document.querySelector('#width').value;
    const height_px = +document.querySelector('#height').value;
    const offset = +document.querySelector('#offset').value;
    const amplitude = +document.querySelector('#amplitude').value;
    const frequency = +document.querySelector('#frequency').value;
    const points = +document.querySelector('#points').value;
    const inverted = document.querySelector('#inverted').checked;
    const centered = document.querySelector('#centered').checked;
    const unit = document.querySelector('#units').value;
    const units = 2 * Math.PI * frequency / points;
    const path = 'clip-path: polygon(100% 100%, 0% 100% ';
    const invertedpath = 'clip-path: polygon(100% 0%, 0% 0% ';

    let phase = +document.querySelector('#phase').value;
    if (centered) {
        phase = centeredPhase(frequency, inverted);
        document.getElementById('phase').value = +phase.toFixed(2);
        document.getElementById('phase-range').value = phase;
    }
    document.getElementById('phase').disabled = centered;
    document.getElementById('phase-range').disabled = centered;
    document.getElementById('units-hint').textContent = UNIT_HINTS[unit];

    let previewPath = inverted ? invertedpath : path;
    let clipPathString = previewPath;

    let radPhase = phase * Math.PI / 180;

    for (let i = 0; i <= points; i++) {
        let val = offset + amplitude * Math.cos(i * units + radPhase);
        let valX = (i * 100 / points).toFixed(2) + '%';
        previewPath += ', ' + valX + ' ' + formatY(val, width_px, height_px, inverted, '%');
        clipPathString += ', ' + valX + ' ' + formatY(val, width_px, height_px, inverted, unit);
    }
    previewPath += ');';
    clipPathString += ');';

    clipPath = clipPathString;
    let divEl = document.getElementById('wave-container');
    const waveColor = document.getElementById('waveColor').value;
    const displayArea = document.getElementById('display-area');
    const maxWidth = displayArea ? displayArea.clientWidth : width_px;
    const renderWidth = Math.min(width_px, maxWidth);
    const scale = renderWidth / width_px;
    const renderHeight = Math.round(height_px * scale);
    // The preview is scaled to fit, so it always uses the percentage version of the path.
    divEl.style = `width:${renderWidth}px;height:${renderHeight}px;background-color:${waveColor}; ` + previewPath;
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

// Splits on a separator, ignoring separators inside parentheses (e.g. calc()).
function splitTopLevel(text, separator) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const char of text) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (depth === 0 && (separator === ' ' ? /\s/.test(char) : char === separator)) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);
    return parts.map(function(part) { return part.trim(); }).filter(Boolean);
}

// Parses "12.5%", "40px", "3vw", "0" or "calc(100% - 40px)".
function parseLength(token) {
    const fromEnd = token.match(/^calc\(\s*100%\s*-\s*(-?\d*\.?\d+)(px|vw)\s*\)$/i);
    if (fromEnd) return { value: +fromEnd[1], unit: fromEnd[2].toLowerCase(), fromEnd: true };
    const plain = token.match(/^(-?\d*\.?\d+)(%|px|vw)?$/i);
    if (!plain || (!plain[2] && +plain[1] !== 0)) return null;
    return { value: +plain[1], unit: (plain[2] || '%').toLowerCase(), fromEnd: false };
}

function isCorner(point) {
    const isEdge = function(length) {
        return length.unit === '%' && !length.fromEnd && (length.value === 0 || length.value === 100);
    };
    return isEdge(point.x) && isEdge(point.y);
}

function parseClipPath(text) {
    const start = text.search(/polygon\s*\(/i);
    if (start === -1) throw new Error('Could not find polygon(...) in the pasted code.');

    const open = text.indexOf('(', start);
    let depth = 0;
    let end = -1;
    for (let i = open; i < text.length; i++) {
        if (text[i] === '(') depth++;
        if (text[i] === ')' && --depth === 0) { end = i; break; }
    }
    if (end === -1) throw new Error('The polygon(...) is missing its closing bracket.');

    const points = splitTopLevel(text.slice(open + 1, end), ',').map(function(pair) {
        const coords = splitTopLevel(pair, ' ');
        const point = coords.length === 2 && { x: parseLength(coords[0]), y: parseLength(coords[1]) };
        if (!point || !point.x || !point.y || point.x.unit !== '%' || point.x.fromEnd) {
            throw new Error(`Could not read the point "${pair}".`);
        }
        return point;
    });

    // Output from this tool starts with the two anchor corners; other tools may put them anywhere.
    const hasToolAnchors = points.length > 2 && isCorner(points[0]) && isCorner(points[1])
        && points[0].x.value === 100 && points[1].x.value === 0 && points[0].y.value === points[1].y.value;
    const corners = hasToolAnchors ? points.slice(0, 2) : points.filter(isCorner);
    const wave = (hasToolAnchors ? points.slice(2) : points.filter(function(p) { return !isCorner(p); }))
        .sort(function(a, b) { return a.x.value - b.x.value; });

    if (wave.length < 3) throw new Error('The polygon needs at least 3 wave points to import.');
    const unit = wave[0].y.unit;
    if (wave.some(function(p) { return p.y.unit !== unit; })) {
        throw new Error('All wave points need to use the same unit (%, px or vw).');
    }

    return {
        inverted: corners.length > 0 && corners.every(function(c) { return c.y.value === 0; }),
        unit: unit,
        wave: wave,
    };
}

// Least-squares fit of y = offset + a*cos(t) + b*sin(t) for the given angles.
function fitCosine(angles, ys) {
    // The tiny diagonal terms keep the system solvable when a column is all zeros
    // (e.g. sin(t) at whole-number frequencies), and push its coefficient to ~0.
    const m = [[0, 0, 0], [0, 1e-9, 0], [0, 0, 1e-9]];
    const v = [0, 0, 0];
    angles.forEach(function(t, i) {
        const row = [1, Math.cos(t), Math.sin(t)];
        for (let r = 0; r < 3; r++) {
            v[r] += row[r] * ys[i];
            for (let c = 0; c < 3; c++) m[r][c] += row[r] * row[c];
        }
    });

    // Gaussian elimination with partial pivoting.
    for (let col = 0; col < 3; col++) {
        let pivot = col;
        for (let r = col + 1; r < 3; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
        if (Math.abs(m[pivot][col]) < 1e-9) return null;
        [m[col], m[pivot]] = [m[pivot], m[col]];
        [v[col], v[pivot]] = [v[pivot], v[col]];
        for (let r = 0; r < 3; r++) {
            if (r === col) continue;
            const factor = m[r][col] / m[col][col];
            for (let c = col; c < 3; c++) m[r][c] -= factor * m[col][c];
            v[r] -= factor * v[col];
        }
    }
    const [offset, a, b] = v.map(function(value, i) { return value / m[i][i]; });

    const sumSquares = angles.reduce(function(sum, t, i) {
        const diff = ys[i] - (offset + a * Math.cos(t) + b * Math.sin(t));
        return sum + diff * diff;
    }, 0);
    return { offset: offset, a: a, b: b, rms: Math.sqrt(sumSquares / angles.length) };
}

function waveRms(params, xs, ys) {
    const sumSquares = xs.reduce(function(sum, x, i) {
        const t = 2 * Math.PI * params.frequency * x / 100 + params.phase * Math.PI / 180;
        const diff = ys[i] - (params.offset + params.amplitude * Math.cos(t));
        return sum + diff * diff;
    }, 0);
    return Math.sqrt(sumSquares / xs.length);
}

// Finds the frequency, phase, offset and amplitude whose wave best matches the points.
// `tolerance` is the rounding error of the pasted values in px: when whole-number
// settings reproduce the points within it, those are used instead of the raw fit.
function fitWave(xs, ys, tolerance) {
    let best = null;
    const tryFrequencies = function(from, to, step) {
        for (let f = from; f <= to + 1e-9; f += step) {
            const frequency = +f.toFixed(2);
            const fit = fitCosine(xs.map(function(x) { return 2 * Math.PI * frequency * x / 100; }), ys);
            // Aliased frequencies fit equally well, so only switch on a clear improvement to keep the lowest.
            if (fit && (!best || fit.rms < best.rms - 1e-6)) best = Object.assign(fit, { frequency: frequency });
        }
    };
    tryFrequencies(0.1, 10, 0.1);
    const exactEnough = best && best.rms < 0.05;
    if (!exactEnough) tryFrequencies(0.1, 10, 0.01);
    if (!best) return null;

    // a*cos(t) + b*sin(t) = amplitude * cos(t + phase)
    const fitted = {
        offset: best.offset,
        amplitude: Math.hypot(best.a, best.b),
        frequency: best.frequency,
        phase: (Math.atan2(-best.b, best.a) * 180 / Math.PI + 360) % 360,
    };
    const round = function(value, decimals) { return +value.toFixed(decimals); };
    const candidates = [
        Object.assign({}, fitted, { offset: round(fitted.offset, 0), amplitude: round(fitted.amplitude, 0), phase: round(fitted.phase, 0) % 360 }),
        Object.assign({}, fitted, { offset: round(fitted.offset, 0), amplitude: round(fitted.amplitude, 0), phase: round(fitted.phase, 2) }),
        Object.assign({}, fitted, { offset: round(fitted.offset, 2), amplitude: round(fitted.amplitude, 2), phase: round(fitted.phase, 2) }),
    ];
    const chosen = candidates.find(function(c) { return waveRms(c, xs, ys) <= tolerance; }) || candidates[2];
    return Object.assign(chosen, { rms: waveRms(chosen, xs, ys) });
}

function setControl(id, value) {
    document.getElementById(id).value = value;
    const range = document.getElementById(id + '-range');
    if (range) range.value = value;
}

function importClipPath() {
    const message = document.getElementById('import-message');
    const showMessage = function(text, isError) {
        message.textContent = text;
        message.classList.toggle('error', isError);
    };

    let parsed;
    try {
        parsed = parseClipPath(document.getElementById('importInput').value);
    } catch (error) {
        showMessage(error.message, true);
        return;
    }

    const width_px = +document.querySelector('#width').value;
    const height_px = +document.querySelector('#height').value;
    // Convert every wave point to px from the top of the current width x height box.
    const ys = parsed.wave.map(function(point) {
        const y = point.y;
        const px = y.unit === '%' ? y.value * height_px / 100 : y.unit === 'vw' ? y.value * width_px / 100 : y.value;
        return y.fromEnd ? height_px - px : px;
    });
    // Evenly spaced x values (as this tool outputs) are rounded too, so use the exact positions.
    const last = parsed.wave.length - 1;
    const evenlySpaced = parsed.wave.every(function(point, i) { return Math.abs(point.x.value - i * 100 / last) <= 0.006; });
    const xs = parsed.wave.map(function(point, i) { return evenlySpaced ? i * 100 / last : point.x.value; });

    // Pasted values are rounded to 2 decimals, so each point may be off by up to 0.005 of its unit.
    const unitPx = parsed.unit === '%' ? height_px / 100 : parsed.unit === 'vw' ? width_px / 100 : 1;
    const fit = fitWave(xs, ys, 0.005 * unitPx);
    if (!fit) {
        showMessage('Could not fit a wave to these points.', true);
        return;
    }

    const points = Math.min(100, Math.max(5, parsed.wave.length - 1));
    setControl('offset', fit.offset);
    setControl('amplitude', fit.amplitude);
    setControl('frequency', fit.frequency);
    setControl('phase', fit.phase);
    setControl('points', points);
    document.getElementById('inverted').checked = parsed.inverted;
    document.getElementById('centered').checked = false;
    document.getElementById('units').value = parsed.unit;
    generateWave();

    const errorPercent = fit.rms / height_px * 100;
    if (errorPercent < 0.5) {
        showMessage(`Imported ${parsed.wave.length} points. Use the controls to keep editing.`, false);
    } else {
        showMessage(
            `This polygon isn't a single smooth wave, so it was approximated (average difference ${errorPercent.toFixed(1)}% of the height).`,
            false
        );
    }
}

(function() {
    generateWave();
    window.addEventListener('resize', generateWave);
})();

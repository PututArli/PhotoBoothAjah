const $ = id => document.getElementById(id);
const video = $('video');
const flashEl = $('flash-overlay');
const countdownNum = $('countdown-num');
const photoCounter = $('photo-counter');
const counterText = $('counter-text');
const startBtn = $('start-btn');
const loader = $('loader');
const modal = $('modal');
const resultCanvas = $('result-canvas');
const btnClose = $('modal-close');
const btnRetake = $('btn-retake');
const btnDownload = $('btn-download');
const customText = $('custom-text');
const showDate = $('show-date');
const customColor = $('custom-color');
const previewCanvas = $('session-preview');
const btnSwitchCam = $('btn-switch-cam');
const btnResetAdjust = $('reset-adjust');
const btnSaveGallery = $('btn-save-gallery');
const btnOpenGallery = $('btn-open-gallery');
const galleryModal = $('gallery-modal');
const galleryClose = $('gallery-close');
const galleryGrid = $('gallery-grid');
const galleryBadge = $('gallery-badge');

const galleryViewModal = $('gallery-view-modal');
const galleryViewImg = $('gallery-view-img');
const galleryViewClose = $('gallery-view-close');
const btnGalleryDelete = $('btn-gallery-delete');
const btnGalleryDownload = $('btn-gallery-download');
const Composition = window.StudioBoothComposition;
const AudioKit = window.StudioBoothAudio;

let currentStream = null;
let currentFacingMode = 'user';
let savedGallery = [];
let currentViewId = null;
const isMobileDevice = window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
let previewPlaceholders = [];

const colorFilters = [
    { id:'none', label:'Normal', css:'none' },
    { id:'bw', label:'B & W', css:'grayscale(100%) contrast(110%)' },
    { id:'vintage', label:'Vintage', css:'sepia(50%) contrast(120%) saturate(150%)' },
    { id:'sepia', label:'Sepia', css:'sepia(100%)' },
    { id:'warm', label:'Warm', css:'saturate(130%) hue-rotate(-20deg) brightness(105%)' },
    { id:'cool', label:'Cool', css:'saturate(120%) hue-rotate(30deg) brightness(102%)' },
    { id:'film', label:'Retro', css:'contrast(130%) saturate(110%) brightness(95%)' },
    { id:'dramatic', label:'Drama', css:'contrast(150%) brightness(85%) saturate(120%)' }
];

const layouts = {
    strip3:  { count:3, cols:1, rows:3 },
    strip4:  { count:4, cols:1, rows:4 },
    grid2x2: { count:4, cols:2, rows:2 },
    single:  { count:1, cols:1, rows:1 },
};

let S = {
    color: 'none',
    colorCSS: 'none',
    layout: 'strip3',
    sessionCount: 3,
    timer: 3,
    frameBg: { type: 'solid', val: '#ffffff' },
    photoBorder: 'plain',
    text: '',
    date: true,
    photos: [],
    capturing: false,
    quote: '',
    adj: { b: 100, c: 100, s: 100, w: 0 }
};

async function initCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    loader.classList.remove('done');
    startBtn.disabled = true;

    const markCameraReady = () => {
        loader.classList.add('done');
        startBtn.disabled = false;
        applyFilters();
        renderPreview();
    };

    const waitForCameraReady = () => new Promise(resolve => {
        let finished = false;
        const done = () => {
            if (finished) return;
            finished = true;
            resolve();
        };

        const checkReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
                done();
            }
        };

        video.addEventListener('loadedmetadata', checkReady, { once: true });
        video.addEventListener('loadeddata', checkReady, { once: true });
        video.addEventListener('canplay', checkReady, { once: true });
        video.addEventListener('playing', checkReady, { once: true });
        video.addEventListener('error', done, { once: true });

        const timeoutId = setTimeout(done, 3500);

        video.addEventListener('loadedmetadata', () => clearTimeout(timeoutId), { once: true });
        video.addEventListener('loadeddata', () => clearTimeout(timeoutId), { once: true });
        video.addEventListener('canplay', () => clearTimeout(timeoutId), { once: true });
        video.addEventListener('playing', () => clearTimeout(timeoutId), { once: true });
    });

    try {
        const idealWidth = isMobileDevice ? 640 : 1280;
        const idealHeight = isMobileDevice ? 480 : 720;
        const stream = await navigator.mediaDevices.getUserMedia({
            video:{ width:{ideal: idealWidth}, height:{ideal: idealHeight}, facingMode: currentFacingMode },
            audio:false
        });
        currentStream = stream;
        video.srcObject = stream;
        video.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
        try {
            await video.play();
        } catch (playError) {
            // Autoplay can still be blocked on some mobile browsers; the ready check below will handle it.
        }

        await waitForCameraReady();
        markCameraReady();
    } catch(e) {
        console.error('Camera init failed:', e);
        loader.innerHTML = '<p style="color:#f87171; text-align:center">Gagal memuat kamera.<br>Pastikan izin kamera diberikan.<br><button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;border-radius:8px;background:#fff;color:#000;border:none;cursor:pointer;font-weight:600">Refresh</button></p>';
    }
}

async function init() {
    buildUI();
    buildPreviewPlaceholders();
    renderPreview();
    await initCamera();
}

function getCombinedFilter() {
    const adjCSS = `brightness(${S.adj.b}%) contrast(${S.adj.c}%) saturate(${S.adj.s}%) sepia(${S.adj.w}%)`;
    if (S.colorCSS === 'none') return adjCSS;
    return `${adjCSS} ${S.colorCSS}`;
}

function applyFilters() {
    video.style.filter = getCombinedFilter();
}

function getSessionCount() {
    return Math.max(1, S.sessionCount || 3);
}

function buildPreviewPlaceholders() {
    previewPlaceholders = [];
    const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff'];

    for (let i = 0; i < 6; i++) {
        const pC = document.createElement('canvas');
        pC.width = 1200;
        pC.height = 900;
        const ctx = pC.getContext('2d');

        const c1 = colors[i % colors.length];
        const c2 = colors[(i + 2) % colors.length];
        const grad = ctx.createLinearGradient(0, 0, 1200, 900);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 900);

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.arc(260, 210, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(920, 630, 180, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.arc(600, 440, 220, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 84px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PREVIEW ${i + 1}`, 600, 800);

        previewPlaceholders.push(pC);
    }
}

function resetCurrentSession() {
    S.photos = [];
    S.capturing = false;
    modal.classList.add('hidden');
    photoCounter.classList.add('hidden');
    countdownNum.textContent = '';
    countdownNum.classList.remove('show');
    flashEl.classList.remove('flash');
    startBtn.disabled = false;
    renderPreview();
}

function buildUI() {
    $('color-list').innerHTML = colorFilters.map(f =>
        `<button class="opt-btn ${f.id==='none'?'active':''}" data-cf="${f.id}">${f.label}</button>`
    ).join('');

    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
            t.classList.add('active');
            $(`panel-${t.dataset.tab}`).classList.add('active');
        });
    });

    $('adj-bright').addEventListener('input', e => { S.adj.b = e.target.value; applyFilters(); renderPreview(); });
    $('adj-contrast').addEventListener('input', e => { S.adj.c = e.target.value; applyFilters(); renderPreview(); });
    $('adj-sat').addEventListener('input', e => { S.adj.s = e.target.value; applyFilters(); renderPreview(); });
    $('adj-warm').addEventListener('input', e => { S.adj.w = e.target.value; applyFilters(); renderPreview(); });

    btnResetAdjust.addEventListener('click', () => {
        $('adj-bright').value = 100;
        $('adj-contrast').value = 100;
        $('adj-sat').value = 100;
        $('adj-warm').value = 0;
        S.adj = { b: 100, c: 100, s: 100, w: 0 };
        applyFilters();
        renderPreview();
    });

    document.querySelectorAll('[data-cf]').forEach(b => {
        b.addEventListener('click', e => {
            document.querySelectorAll('[data-cf]').forEach(x=>x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const f = colorFilters.find(c=>c.id===e.currentTarget.dataset.cf);
            S.color = f.id;
            S.colorCSS = f.css;
            applyFilters();
            renderPreview();
        });
    });

    document.querySelectorAll('[data-layout]').forEach(b => {
        b.addEventListener('click', e => {
            document.querySelectorAll('[data-layout]').forEach(x=>x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            S.layout = e.currentTarget.dataset.layout;
            renderPreview();
        });
    });

    document.querySelectorAll('[data-session-count]').forEach(b => {
        b.addEventListener('click', e => {
            document.querySelectorAll('[data-session-count]').forEach(x=>x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            S.sessionCount = parseInt(e.currentTarget.dataset.sessionCount, 10);
            renderPreview();
        });
    });

    document.querySelectorAll('[data-timer]').forEach(b => {
        b.addEventListener('click', e => {
            document.querySelectorAll('[data-timer]').forEach(x=>x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            S.timer = parseInt(e.currentTarget.dataset.timer);
        });
    });

    document.querySelectorAll('.swatch:not(.custom-sw)').forEach(b => {
        b.addEventListener('click', e => {
            document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            S.frameBg = {
                type: e.currentTarget.dataset.bg,
                val: e.currentTarget.dataset.val
            };
            renderPreview();
        });
    });

    customColor.addEventListener('input', e => {
        document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));
        customColor.parentElement.classList.add('active');
        S.frameBg = { type: 'solid', val: e.target.value };
        renderPreview();
    });

    document.querySelectorAll('[data-border]').forEach(b => {
        b.addEventListener('click', e => {
            document.querySelectorAll('[data-border]').forEach(x=>x.classList.remove('active'));
            e.currentTarget.classList.add('active');
            S.photoBorder = e.currentTarget.dataset.border;
            renderPreview();
        });
    });

    customText.addEventListener('input', e => { S.text = e.target.value; renderPreview(); });
    showDate.addEventListener('change', e => { S.date = e.target.checked; renderPreview(); });

    startBtn.addEventListener('click', captureSession);
    btnClose.addEventListener('click', resetCurrentSession);
    btnRetake.addEventListener('click', resetCurrentSession);

    btnSwitchCam.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        initCamera();
    });
}

function renderPreview() {
    if (!previewCanvas) return;
    const scale = isMobileDevice ? 0.1 : 0.16;
    Composition.renderComposition(previewCanvas, {
        layoutKey: S.layout,
        sessionCount: getSessionCount(),
        frameBg: S.frameBg,
        photoBorder: S.photoBorder,
        text: S.text,
        date: S.date,
        quote: S.quote,
        previewMode: true,
        liveVideo: video,
        liveFilter: getCombinedFilter(),
        mirrorLive: currentFacingMode === 'user',
        scale,
        getPhoto: index => S.photos[index] || (index === 0 && video.videoWidth && video.videoHeight ? video : previewPlaceholders[index % previewPlaceholders.length]),
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function captureSession() {
    if (S.capturing) return;
    S.capturing = true;
    startBtn.disabled = true;
    S.photos = [];
    renderPreview();
    
    try {
        const res = await fetch('https://dummyjson.com/quotes/random');
        const data = await res.json();
        S.quote = data.quote;
    } catch(e) {
        S.quote = "Creating beautiful memories ✨";
    }

    const layout = Composition.getLayoutMetrics(S.layout, getSessionCount());
    photoCounter.classList.remove('hidden');

    for (let i = 0; i < layout.count; i++) {
        counterText.textContent = `${i+1} / ${layout.count}`;

        for (let t = S.timer; t > 0; t--) {
            countdownNum.textContent = t;
            countdownNum.classList.add('show');
            AudioKit.beep(880);
            await sleep(1000);
        }
        countdownNum.classList.remove('show');

        AudioKit.beep(1760, 0.15);
        AudioKit.shutterSound();
        flashEl.classList.add('flash');
        takePhoto();
        renderPreview();
        await sleep(200);
        flashEl.classList.remove('flash');

        if (i < layout.count - 1) await sleep(700);
    }

    photoCounter.classList.add('hidden');
    renderStrip();
    modal.classList.remove('hidden');
    S.capturing = false;
    renderPreview();
}

function takePhoto() {
    const comp = document.createElement('canvas');
    comp.width = video.videoWidth;
    comp.height = video.videoHeight;
    const cc = comp.getContext('2d');

    cc.filter = getCombinedFilter();
    Composition.drawSourceIntoSlot(cc, video, 0, 0, comp.width, comp.height, currentFacingMode === 'user');
    cc.filter = 'none';

    const photoW = 1200;
    const photoH = 900;
    const photo = document.createElement('canvas');
    photo.width = photoW;
    photo.height = photoH;
    const pc = photo.getContext('2d');

    const vR = comp.width / comp.height;
    const cR = photoW / photoH;
    let sx=0, sy=0, sW=comp.width, sH=comp.height;
    if (vR > cR) { sW = sH * cR; sx = (comp.width - sW)/2; }
    else { sH = sW / cR; sy = (comp.height - sH)/2; }

    pc.drawImage(comp, sx, sy, sW, sH, 0, 0, photoW, photoH);
    S.photos.push(photo);
}

function renderStrip() {
    Composition.renderComposition(resultCanvas, {
        layoutKey: S.layout,
        sessionCount: getSessionCount(),
        frameBg: S.frameBg,
        photoBorder: S.photoBorder,
        text: S.text,
        date: S.date,
        quote: S.quote,
        photos: S.photos,
        previewMode: false,
        mirrorLive: currentFacingMode === 'user',
        scale: 1,
    });
    btnDownload.href = resultCanvas.toDataURL('image/png');
    btnDownload.download = `StudioBooth_${Date.now()}.png`;
}

function isColorDark(hex) {
    if(hex === 'polka') return false;
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16);
    const g = parseInt(c.substr(2,2),16);
    const b = parseInt(c.substr(4,2),16);
    return (r*0.299 + g*0.587 + b*0.114) < 128;
}

function saveToGallery() {
    const dataUrl = resultCanvas.toDataURL('image/png');
    savedGallery.push({
        id: Date.now(),
        img: dataUrl
    });
    
    updateGalleryUI();
    resetCurrentSession();
}

function updateGalleryUI() {
    galleryBadge.textContent = savedGallery.length;
    if (savedGallery.length > 0) {
        galleryBadge.classList.remove('hidden');
    } else {
        galleryBadge.classList.add('hidden');
    }

    if (savedGallery.length === 0) {
        galleryGrid.innerHTML = '<p class="muted-text" style="grid-column: 1/-1; text-align:center;">Belum ada foto yang disimpan.</p>';
        return;
    }

    galleryGrid.innerHTML = savedGallery.map(item => `
        <div class="gallery-item" onclick="viewInGallery(${item.id})">
            <img src="${item.img}" alt="Sesi Foto">
        </div>
    `).reverse().join('');
}

window.viewInGallery = function(id) {
    const item = savedGallery.find(x => x.id === id);
    if(!item) return;
    currentViewId = id;
    galleryViewImg.src = item.img;
    btnGalleryDownload.href = item.img;
    btnGalleryDownload.download = `StudioBooth_${id}.png`;
    galleryViewModal.classList.remove('hidden');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
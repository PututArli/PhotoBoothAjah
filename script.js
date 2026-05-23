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
let currentDeviceId = null;
let videoDevices = [];
let savedGallery = [];
const cameraSelect = $('camera-select');
let currentViewId = null;
const isMobileDevice = window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
let previewPlaceholders = [];
let activeSession = null;
let sessionCancelled = false;
let currentFetchController = null;

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
        if (videoDevices.length === 0) {
            try {
                // Request initially to get permission and see all labels
                await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(s => s.getTracks().forEach(t => t.stop()));
                const devices = await navigator.mediaDevices.enumerateDevices();
                videoDevices = devices.filter(d => d.kind === 'videoinput');
                
                if (cameraSelect) {
                    cameraSelect.innerHTML = videoDevices.map((d, i) => `<option value="${d.deviceId}">${d.label || 'Kamera ' + (i + 1)}</option>`).join('');
                    if (videoDevices.length > 0) {
                        currentDeviceId = videoDevices[0].deviceId;
                        cameraSelect.value = currentDeviceId;
                    }
                    cameraSelect.addEventListener('change', (e) => {
                        currentDeviceId = e.target.value;
                        initCamera();
                    });
                }
            } catch (e) {
                console.warn('Could not enumerate devices:', e);
            }
        }

        const idealWidth = isMobileDevice ? 640 : 1280;
        const idealHeight = isMobileDevice ? 480 : 720;
        
        let videoConstraints = { width:{ideal: idealWidth}, height:{ideal: idealHeight} };
        if (currentDeviceId) {
            videoConstraints.deviceId = { exact: currentDeviceId };
        } else {
            videoConstraints.facingMode = currentFacingMode;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false
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
    return getCombinedFilterFor(S);
}

function getCombinedFilterFor(state) {
    const adj = state.adj || { b: 100, c: 100, s: 100, w: 0 };
    const adjCSS = `brightness(${adj.b}%) contrast(${adj.c}%) saturate(${adj.s}%) sepia(${adj.w}%)`;
    if ((state.colorCSS || 'none') === 'none') return adjCSS;
    return `${adjCSS} ${state.colorCSS}`;
}

function applyFilters() {
    video.style.filter = getCombinedFilter();
}

function getSessionCount() {
    return Math.max(1, S.sessionCount || 3);
}

function createSessionSnapshot() {
    return {
        color: S.color,
        colorCSS: S.colorCSS,
        layout: S.layout,
        sessionCount: getSessionCount(),
        timer: S.timer,
        frameBg: { ...S.frameBg },
        photoBorder: S.photoBorder,
        text: S.text,
        date: S.date,
        photos: [],
        quote: '',
        adj: { ...S.adj },
        facingMode: currentFacingMode,
    };
}

function setCaptureLocked(isLocked) {
    document.querySelectorAll('.sidebar button, .sidebar input, .sidebar textarea').forEach(element => {
        if (element === btnOpenGallery) return;
        element.disabled = isLocked;
    });
    if (!isLocked) {
        startBtn.disabled = false;
    }
    btnSwitchCam.disabled = isLocked;
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
    activeSession = null;
    document.body.classList.remove('capturing-mode');
    modal.classList.add('hidden');
    photoCounter.classList.add('hidden');
    countdownNum.textContent = '';
    countdownNum.classList.remove('show');
    flashEl.classList.remove('flash');
    setCaptureLocked(false);
    renderPreview();
}

function exportCanvasDataUrl(sourceCanvas) {
    const maxSide = isMobileDevice ? 1600 : 2200;
    const sourceWidth = sourceCanvas.width || 1;
    const sourceHeight = sourceCanvas.height || 1;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));

    if (scale >= 1) {
        return sourceCanvas.toDataURL('image/jpeg', isMobileDevice ? 0.88 : 0.94);
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.round(sourceWidth * scale);
    exportCanvas.height = Math.round(sourceHeight * scale);
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.drawImage(sourceCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    return exportCanvas.toDataURL('image/jpeg', isMobileDevice ? 0.88 : 0.94);
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
    btnSaveGallery.addEventListener('click', saveToGallery);
    btnOpenGallery.addEventListener('click', () => galleryModal.classList.remove('hidden'));
    galleryClose.addEventListener('click', () => galleryModal.classList.add('hidden'));
    galleryViewClose.addEventListener('click', () => galleryViewModal.classList.add('hidden'));
    btnGalleryDelete.addEventListener('click', () => {
        if (!currentViewId) return;
        savedGallery = savedGallery.filter(item => item.id !== currentViewId);
        currentViewId = null;
        updateGalleryUI();
        galleryViewModal.classList.add('hidden');
    });

    btnSwitchCam.addEventListener('click', () => {
        if (videoDevices.length > 1) {
            const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
            const nextIndex = (currentIndex + 1) % videoDevices.length;
            currentDeviceId = videoDevices[nextIndex].deviceId;
            if (cameraSelect) cameraSelect.value = currentDeviceId;
            initCamera();
        } else {
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            initCamera();
        }
    });

    $('btn-cancel-session').addEventListener('click', () => {
        if (S.capturing) {
            sessionCancelled = true;
            if (currentFetchController) {
                currentFetchController.abort();
                currentFetchController = null;
            }
            resetCurrentSession();
        }
    });
}

function renderPreview() {
    if (!previewCanvas) return;
    const isSidebarHidden = window.getComputedStyle(previewCanvas).display === 'none';
    const isCapturing = document.body.classList.contains('capturing-mode');
    
    if (isSidebarHidden && !isCapturing) return;

    const scale = isMobileDevice ? 0.1 : 0.16;
    
    // Use activeSession data when capturing (photos go to session.photos, not S.photos)
    const photos = activeSession ? activeSession.photos : S.photos;
    const quote = activeSession ? activeSession.quote : S.quote;
    
    const canvases = [];
    if (!isSidebarHidden) canvases.push(previewCanvas);
    
    const capCanvas = $('capture-preview-canvas');
    if (capCanvas && isCapturing) {
        canvases.push(capCanvas);
    }
    
    for (const cvs of canvases) {
        let cvsScale = scale;
        
        if (cvs === previewCanvas && cvs.parentElement.classList.contains('preview-scroll-container')) {
            if (S.layout.startsWith('strip')) {
                cvs.parentElement.classList.add('is-strip');
            } else {
                cvs.parentElement.classList.remove('is-strip');
            }
        } else if (cvs === capCanvas) {
            cvsScale = isMobileDevice ? 0.08 : 0.12;
            if (S.layout.startsWith('strip')) {
                cvs.parentElement.classList.add('is-strip');
            } else {
                cvs.parentElement.classList.remove('is-strip');
            }
        }
        
        Composition.renderComposition(cvs, {
            layoutKey: S.layout,
            sessionCount: getSessionCount(),
            frameBg: S.frameBg,
            photoBorder: S.photoBorder,
            text: S.text,
            date: S.date,
            quote: quote,
            previewMode: true,
            liveVideo: video,
            liveFilter: getCombinedFilter(),
            mirrorLive: currentFacingMode === 'user',
            scale: cvsScale,
            getPhoto: index => photos[index] || (index === 0 && video.videoWidth && video.videoHeight ? video : previewPlaceholders[index % previewPlaceholders.length]),
        });
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function captureSession() {
    if (S.capturing) return;
    S.capturing = true;
    sessionCancelled = false;
    document.body.classList.add('capturing-mode');
    setCaptureLocked(true);
    const session = createSessionSnapshot();
    activeSession = session;
    renderPreview();
    
    try {
        currentFetchController = new AbortController();
        const timeoutId = setTimeout(() => {
            if (currentFetchController) currentFetchController.abort();
        }, 2000);
        const res = await fetch('https://dummyjson.com/quotes/random', { signal: currentFetchController.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        session.quote = data.quote;
    } catch(e) {
        session.quote = "Creating beautiful memories ✨";
    } finally {
        currentFetchController = null;
    }

    if (sessionCancelled) { resetCurrentSession(); return; }

    const layout = Composition.getLayoutMetrics(session.layout, session.sessionCount);
    photoCounter.classList.remove('hidden');

    let cancelled = false;
    for (let i = 0; i < layout.count; i++) {
        counterText.textContent = `${i+1} / ${layout.count}`;

        for (let t = session.timer; t > 0; t--) {
            countdownNum.textContent = t;
            countdownNum.classList.add('show');
            AudioKit.beep(880);
            await sleep(1000);
            if (sessionCancelled) { cancelled = true; break; }
        }
        if (cancelled) break;
        countdownNum.classList.remove('show');

        AudioKit.beep(1760, 0.15);
        AudioKit.shutterSound();
        flashEl.classList.add('flash');
        takePhoto(session);
        renderPreview();
        await sleep(200);
        flashEl.classList.remove('flash');
        if (sessionCancelled) { cancelled = true; break; }

        if (i < layout.count - 1) {
            await sleep(700);
            if (sessionCancelled) { cancelled = true; break; }
        }
    }

    if (cancelled) {
        resetCurrentSession();
        return;
    }

    photoCounter.classList.add('hidden');
    renderStrip(session);
    modal.classList.remove('hidden');
    session.photos = session.photos || [];
    S.photos = session.photos.slice();
    S.quote = session.quote;
    S.capturing = false;
    activeSession = null;
    document.body.classList.remove('capturing-mode');
    setCaptureLocked(false);
    renderPreview();
}

function takePhoto(session) {
    const comp = document.createElement('canvas');
    comp.width = video.videoWidth;
    comp.height = video.videoHeight;
    const cc = comp.getContext('2d');

    cc.filter = getCombinedFilterFor(session);
    Composition.drawSourceIntoSlot(cc, video, 0, 0, comp.width, comp.height, session.facingMode === 'user');
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
    session.photos.push(photo);
}

function renderStrip(session = activeSession || createSessionSnapshot()) {
    Composition.renderComposition(resultCanvas, {
        layoutKey: session.layout,
        sessionCount: session.sessionCount,
        frameBg: session.frameBg,
        photoBorder: session.photoBorder,
        text: session.text,
        date: session.date,
        quote: session.quote,
        photos: session.photos,
        previewMode: false,
        mirrorLive: session.facingMode === 'user',
        scale: 1,
    });
    btnDownload.href = exportCanvasDataUrl(resultCanvas);
    btnDownload.download = `PhotoBoothAjah_${Date.now()}.png`;
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
    const dataUrl = exportCanvasDataUrl(resultCanvas);
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
    btnGalleryDownload.download = `PhotoBoothAjah_${id}.png`;
    galleryViewModal.classList.remove('hidden');
};

// Reinitialize camera if it was lost or frozen (crucial for Android when waking up or switching apps)
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && !S.capturing) {
        let needsRestart = !currentStream;
        if (currentStream) {
            const hasDeadTracks = currentStream.getTracks().some(t => t.readyState === 'ended' || !t.enabled);
            if (hasDeadTracks || video.paused || video.ended) {
                needsRestart = true;
            }
        }
        if (needsRestart) {
            console.log("Detecting inactive/paused camera on visibility restore, restarting camera...");
            await initCamera();
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
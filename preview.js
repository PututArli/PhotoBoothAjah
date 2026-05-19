const state = {
    layout: 'strip3',
    frameBg: { type: 'solid', val: '#ffffff' },
    photoBorder: 'plain',
    text: 'PREVIEW MODE',
    date: true,
    quote: 'Capturing moments perfectly',
    photos: []
};

const canvas = document.getElementById('preview-canvas');
const Composition = window.StudioBoothComposition;

function generatePlaceholders() {
    state.photos = [];
    const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];

    for (let i = 0; i < 4; i++) {
        const pC = document.createElement('canvas');
        pC.width = 1200;
        pC.height = 900;
        const ctx = pC.getContext('2d');

        const c1 = colors[Math.floor(Math.random() * colors.length)];
        const c2 = colors[Math.floor(Math.random() * colors.length)];
        const grad = ctx.createLinearGradient(0, 0, 1200, 900);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 900);

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(600, 450, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(480, 400, 30, 0, Math.PI * 2);
        ctx.arc(720, 400, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(600, 500, 80, 0.2, Math.PI - 0.2);
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`FOTO ${i + 1}`, 600, 800);

        state.photos.push(pC);
    }
}

let previewCollapsed = false;

function renderPreview() {
    const isSmall = window.innerWidth < 768;
    const scale = previewCollapsed ? (isSmall ? 0.35 : 0.6) : 1;

    Composition.renderComposition(canvas, {
        layoutKey: state.layout,
        sessionCount: 3,
        frameBg: state.frameBg,
        photoBorder: state.photoBorder,
        text: state.text,
        date: state.date,
        quote: state.quote,
        photos: state.photos,
        previewMode: false,
        scale: scale,
    });

    // adjust canvas intrinsic sizing to avoid overflow on mobile browsers
    if (isSmall) {
        canvas.style.maxHeight = previewCollapsed ? '120px' : 'calc(45dvh)';
        canvas.style.width = 'auto';
    } else {
        canvas.style.maxHeight = '';
        canvas.style.width = '';
    }
}

function clearActive(selector) {
    document.querySelectorAll(selector).forEach(item => item.classList.remove('active'));
}

document.querySelectorAll('.swatch[data-bg]').forEach(button => {
    button.addEventListener('click', event => {
        clearActive('.swatch');
        event.currentTarget.classList.add('active');
        state.frameBg = {
            type: event.currentTarget.dataset.bg,
            val: event.currentTarget.dataset.val,
        };
        renderPreview();
    });
});

document.querySelectorAll('[data-border]').forEach(button => {
    button.addEventListener('click', event => {
        document.querySelectorAll('[data-border]').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.photoBorder = event.currentTarget.dataset.border;
        renderPreview();
    });
});

document.querySelectorAll('[data-layout]').forEach(button => {
    button.addEventListener('click', event => {
        document.querySelectorAll('[data-layout]').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        state.layout = event.currentTarget.dataset.layout;
        renderPreview();
    });
});

window.addEventListener('load', () => {
    generatePlaceholders();
    renderPreview();
});

// Toggle preview collapse on small screens with animation
const toggleBtn = document.getElementById('preview-toggle');
if (toggleBtn) {
    const wrap = document.querySelector('.preview-wrap');
    toggleBtn.addEventListener('click', () => {
        if (!wrap) return;
        // add animating state to hint browser to optimize
        wrap.classList.add('animating');
        // toggle collapsed state
        previewCollapsed = !previewCollapsed;
        wrap.classList.toggle('collapsed', previewCollapsed);
        toggleBtn.classList.toggle('active', previewCollapsed);
        renderPreview();

        // remove animating class after first transition ends on the canvas
        const onEnd = (ev) => {
            // only respond to a relevant property to avoid multiple fires
            if (ev.propertyName && (ev.propertyName.includes('max-height') || ev.propertyName.includes('opacity') || ev.propertyName.includes('transform'))) {
                wrap.classList.remove('animating');
                canvas.removeEventListener('transitionend', onEnd);
            }
        };
        canvas.addEventListener('transitionend', onEnd);
    });
}

window.addEventListener('resize', () => {
    // ensure canvas resizes sensibly when orientation changes
    renderPreview();
});

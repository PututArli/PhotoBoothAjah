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

function renderPreview() {
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
        scale: 1,
    });
}

document.querySelectorAll('.swatch[data-bg]').forEach(button => {
    button.addEventListener('click', event => {
        document.querySelectorAll('.swatch').forEach(item => item.classList.remove('active'));
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

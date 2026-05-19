window.StudioBoothComposition = (() => {
    const layouts = {
        strip3:  { count: 3, cols: 1, rows: 3 },
        strip4:  { count: 4, cols: 1, rows: 4 },
        grid2x2: { count: 4, cols: 2, rows: 2 },
        single:  { count: 1, cols: 1, rows: 1 },
    };

    function isColorDark(hex) {
        if (!hex) return false;
        const c = String(hex).replace('#', '');
        const r = parseInt(c.substr(0, 2), 16);
        const g = parseInt(c.substr(2, 2), 16);
        const b = parseInt(c.substr(4, 2), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    }

    function getLayoutMetrics(layoutKey, totalPhotos) {
        const layout = layouts[layoutKey] || layouts.strip3;
        const count = Math.max(1, totalPhotos || layout.count);
        let cols = layout.cols;

        if (layoutKey === 'grid2x2') {
            cols = count === 1 ? 1 : 2;
        } else if (layoutKey === 'single') {
            cols = 1;
        }

        const rows = Math.ceil(count / cols);
        return { count, cols, rows };
    }

    function getCompositionMetrics(photoBorder, scale = 1) {
        const pW = 1200 * scale;
        const pH = 900 * scale;
        let pad = 60 * scale;
        let footH = 200 * scale;
        let polTop = 20 * scale;
        let polBottom = 20 * scale;
        let polSide = 20 * scale;

        if (photoBorder === 'polaroid') {
            polTop = 40 * scale;
            polBottom = 160 * scale;
            polSide = 40 * scale;
            pad = 80 * scale;
        } else if (photoBorder === 'film') {
            pad = 80 * scale;
            polTop = 0;
            polBottom = 0;
            polSide = 0;
        } else if (photoBorder === 'tape') {
            polTop = 50 * scale;
            polBottom = 30 * scale;
            polSide = 30 * scale;
            pad = 60 * scale;
        } else if (photoBorder === 'neon') {
            polTop = 40 * scale;
            polBottom = 40 * scale;
            polSide = 40 * scale;
            pad = 80 * scale;
        } else if (photoBorder === 'elegant') {
            polTop = 50 * scale;
            polBottom = 50 * scale;
            polSide = 50 * scale;
            pad = 60 * scale;
        }

        return {
            pW,
            pH,
            pad,
            footH,
            polTop,
            polBottom,
            polSide,
            cellW: pW + polSide * 2,
            cellH: pH + polTop + polBottom,
        };
    }

    function drawSourceIntoSlot(ctx, source, x, y, width, height, mirror = false) {
        const sourceWidth = source.videoWidth || source.width;
        const sourceHeight = source.videoHeight || source.height;
        if (!sourceWidth || !sourceHeight) return;

        const sourceRatio = sourceWidth / sourceHeight;
        const targetRatio = width / height;
        let cropX = 0;
        let cropY = 0;
        let cropW = sourceWidth;
        let cropH = sourceHeight;

        if (sourceRatio > targetRatio) {
            cropW = cropH * targetRatio;
            cropX = (sourceWidth - cropW) / 2;
        } else {
            cropH = cropW / targetRatio;
            cropY = (sourceHeight - cropH) / 2;
        }

        ctx.save();
        if (mirror) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, width, height);
        } else {
            ctx.drawImage(source, cropX, cropY, cropW, cropH, x, y, width, height);
        }
        ctx.restore();
    }

    function drawFrameBackground(ctx, w, h, frameBg) {
        if (frameBg.type === 'solid') {
            ctx.fillStyle = frameBg.val;
            ctx.fillRect(0, 0, w, h);
            return;
        }

        if (frameBg.type === 'gradient') {
            const colors = String(frameBg.val || '').split(',');
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1] || colors[0]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
            return;
        }

        if (frameBg.type === 'pattern' && frameBg.val === 'polka') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ff007f';
            for (let py = 0; py < h; py += 40) {
                for (let px = 0; px < w; px += 40) {
                    ctx.beginPath();
                    ctx.arc(px, py, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    function renderComposition(targetCanvas, options) {
        const {
            layoutKey = 'strip3',
            sessionCount = 3,
            frameBg = { type: 'solid', val: '#ffffff' },
            photoBorder = 'plain',
            text = '',
            date = true,
            quote = '',
            photos = [],
            getPhoto = null,
            previewMode = false,
            liveVideo = null,
            liveFilter = '',
            mirrorLive = false,
            scale = 1,
        } = options || {};

        const layout = getLayoutMetrics(layoutKey, sessionCount);
        const metrics = getCompositionMetrics(photoBorder, scale);
        const ctx = targetCanvas.getContext('2d');

        targetCanvas.width = metrics.cellW * layout.cols + metrics.pad * (layout.cols + 1);
        targetCanvas.height = metrics.cellH * layout.rows + metrics.pad * (layout.rows + 1) + metrics.footH;

        drawFrameBackground(ctx, targetCanvas.width, targetCanvas.height, frameBg);

        if (photoBorder === 'film') {
            let isLight = false;
            if (frameBg.type === 'solid') isLight = !isColorDark(frameBg.val);
            else if (frameBg.type === 'gradient') isLight = !isColorDark(String(frameBg.val || '').split(',')[0]);
            else isLight = true;

            ctx.fillStyle = isLight ? '#000' : '#fff';
            if (frameBg.type === 'gradient' || frameBg.type === 'pattern') ctx.fillStyle = 'rgba(255,255,255,0.8)';

            const holeW = 40 * scale;
            const holeH = 30 * scale;
            const holeXLeft = 20 * scale;
            const holeXRight = targetCanvas.width - 20 * scale - holeW;

            for (let y = 40 * scale; y < targetCanvas.height - metrics.footH; y += 80 * scale) {
                ctx.beginPath();
                ctx.roundRect(holeXLeft, y, holeW, holeH, 6 * scale);
                ctx.roundRect(holeXRight, y, holeW, holeH, 6 * scale);
                ctx.fill();
            }
        }

        const activePhotos = Array.from({ length: layout.count }, (_, index) => {
            if (typeof getPhoto === 'function') return getPhoto(index, layout.count);
            return photos[index];
        });

        activePhotos.forEach((img, i) => {
            const c = i % layout.cols;
            const r = Math.floor(i / layout.cols);
            const cellX = metrics.pad + c * (metrics.cellW + metrics.pad);
            const cellY = metrics.pad + r * (metrics.cellH + metrics.pad);
            const imgX = cellX + metrics.polSide;
            const imgY = cellY + metrics.polTop;

            if (photoBorder !== 'film') {
                ctx.shadowColor = 'rgba(0,0,0,0.15)';
                ctx.shadowBlur = 20 * scale;
                ctx.shadowOffsetY = 10 * scale;
                ctx.fillStyle = photoBorder === 'neon' ? '#0a0a0a' : '#ffffff';
                ctx.fillRect(cellX, cellY, metrics.cellW, metrics.cellH);
                ctx.shadowColor = 'transparent';
            }

            if (img) {
                const isLiveVideo = img === liveVideo;
                const originalFilter = ctx.filter;
                if (previewMode && isLiveVideo && liveFilter) {
                    ctx.filter = liveFilter;
                }
                drawSourceIntoSlot(ctx, img, imgX, imgY, metrics.pW, metrics.pH, isLiveVideo && mirrorLive);
                ctx.filter = originalFilter;
            }

            if (photoBorder === 'tape') {
                ctx.fillStyle = 'rgba(255, 235, 180, 0.8)';
                ctx.save();
                ctx.translate(cellX + metrics.cellW / 2, cellY + 20 * scale);
                ctx.rotate(-0.05);
                ctx.fillRect(-(60 * scale), -(15 * scale), 120 * scale, 30 * scale);
                ctx.restore();
            } else if (photoBorder === 'neon') {
                ctx.shadowColor = '#00f2fe';
                ctx.shadowBlur = 40 * scale;
                ctx.strokeStyle = '#00f2fe';
                ctx.lineWidth = 8 * scale;
                ctx.strokeRect(imgX, imgY, metrics.pW, metrics.pH);
                ctx.shadowColor = 'transparent';
            } else if (photoBorder === 'elegant') {
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 4 * scale;
                ctx.strokeRect(imgX - 15 * scale, imgY - 15 * scale, metrics.pW + 30 * scale, metrics.pH + 30 * scale);
                ctx.lineWidth = 2 * scale;
                ctx.strokeRect(imgX - 22 * scale, imgY - 22 * scale, metrics.pW + 44 * scale, metrics.pH + 44 * scale);
            } else if (photoBorder !== 'film') {
                ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                ctx.lineWidth = 2 * scale;
                ctx.strokeRect(imgX, imgY, metrics.pW, metrics.pH);
            }
        });

        let baseColor = frameBg.val;
        if (frameBg.type === 'gradient') baseColor = String(frameBg.val || '').split(',')[0];
        if (frameBg.type === 'pattern') baseColor = '#ffffff';
        const dark = isColorDark(baseColor);
        const textY = targetCanvas.height - metrics.footH / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const mainLabel = String(text || 'STUDIOBOOTH').trim().toUpperCase();
        ctx.fillStyle = dark ? '#fff' : '#111';
        ctx.font = `800 ${44 * scale}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(mainLabel, targetCanvas.width / 2, textY - 15 * scale);

        if (date) {
            ctx.fillStyle = dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)';
            ctx.font = `600 ${20 * scale}px "Plus Jakarta Sans", sans-serif`;
            const d = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            ctx.fillText(d, targetCanvas.width / 2, textY + 30 * scale);
        }

        ctx.fillStyle = dark ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.7)';
        ctx.font = `italic 500 ${22 * scale}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(`"${quote || 'Preview hasil akan muncul di sini'}"`, targetCanvas.width / 2, textY + 65 * scale);
    }

    return {
        layouts,
        isColorDark,
        getLayoutMetrics,
        getCompositionMetrics,
        drawSourceIntoSlot,
        drawFrameBackground,
        renderComposition,
    };
})();
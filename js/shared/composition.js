window.StudioBoothComposition = (() => {
    const layouts = {
        strip3:  { count: 3, cols: 1, rows: 3 },
        strip4:  { count: 4, cols: 1, rows: 4 },
        grid2x2: { count: 4, cols: 2, rows: 2 },
        single:  { count: 1, cols: 1, rows: 1 },
    };

    const borderPresets = {
        christmas: {
            frame: '#c71f37',
            accent: '#ffd166',
            accentSoft: 'rgba(255, 209, 102, 0.22)',
            symbol: '❄️',
            symbol2: '🎄',
            symbol3: '🎁',
            symbol4: '✨',
        },
        halloween: {
            frame: '#ff7b00',
            accent: '#f7b801',
            accentSoft: 'rgba(247, 184, 1, 0.2)',
            symbol: '🎃',
            symbol2: '🕸️',
            symbol3: '🦇',
            symbol4: '👻',
        },
        newyear: {
            frame: '#00b4d8',
            accent: '#f8f9fa',
            accentSoft: 'rgba(255,255,255,0.18)',
            symbol: '✨',
            symbol2: '🎆',
            symbol3: '🎊',
            symbol4: '🎉',
        },
        birthday: {
            frame: '#ff6fa8',
            accent: '#ffffff',
            accentSoft: 'rgba(255,255,255,0.2)',
            symbol: '🎂',
            symbol2: '🎈',
            symbol3: '🎉',
            symbol4: '🧁',
        },
        romantic: {
            frame: '#ff5d8f',
            accent: '#ffffff',
            accentSoft: 'rgba(255,255,255,0.18)',
            symbol: '💖',
            symbol2: '🌹',
            symbol3: '💌',
            symbol4: '💕',
        },
        summer: {
            frame: '#00c2ff',
            accent: '#ffffff',
            accentSoft: 'rgba(255,255,255,0.16)',
            symbol: '☀️',
            symbol2: '🌴',
            symbol3: '🏖️',
            symbol4: '🍍',
        },
    };

    const themeOrnaments = {
        christmas: [
            { symbol: '❄️', slot: 'top', size: 0.95, alpha: 0.55, rotate: 0 },
            { symbol: '🎁', slot: 'left', size: 0.68, alpha: 0.42, rotate: -0.08 },
            { symbol: '✨', slot: 'right', size: 0.7, alpha: 0.42, rotate: 0.08 },
        ],
        halloween: [
            { symbol: '🎃', slot: 'top', size: 0.95, alpha: 0.55, rotate: 0 },
            { symbol: '🕸️', slot: 'left', size: 0.7, alpha: 0.4, rotate: -0.08 },
            { symbol: '🦇', slot: 'right', size: 0.72, alpha: 0.4, rotate: 0.08 },
        ],
        newyear: [
            { symbol: '🎆', slot: 'top', size: 0.95, alpha: 0.56, rotate: 0 },
            { symbol: '🎊', slot: 'left', size: 0.7, alpha: 0.4, rotate: -0.08 },
            { symbol: '🎉', slot: 'right', size: 0.74, alpha: 0.4, rotate: 0.08 },
        ],
        birthday: [
            { symbol: '🎈', slot: 'top', size: 0.95, alpha: 0.56, rotate: 0 },
            { symbol: '🎂', slot: 'left', size: 0.72, alpha: 0.4, rotate: -0.08 },
            { symbol: '🧁', slot: 'right', size: 0.72, alpha: 0.4, rotate: 0.08 },
        ],
        romantic: [
            { symbol: '💖', slot: 'top', size: 1.0, alpha: 0.62, rotate: 0 },
            { symbol: '💌', slot: 'left', size: 0.72, alpha: 0.42, rotate: -0.08 },
            { symbol: '🌹', slot: 'right', size: 0.74, alpha: 0.42, rotate: 0.08 },
        ],
        summer: [
            { symbol: '☀️', slot: 'top', size: 0.95, alpha: 0.56, rotate: 0 },
            { symbol: '🌴', slot: 'left', size: 0.72, alpha: 0.4, rotate: -0.08 },
            { symbol: '🍍', slot: 'right', size: 0.72, alpha: 0.4, rotate: 0.08 },
        ],
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

    function drawSpecialBorderDecorations(ctx, photoBorder, cellX, cellY, cellW, cellH, polTop, polBottom, polSide, scale = 1) {
        const theme = borderPresets[photoBorder];
        if (!theme) return;
        const ornaments = themeOrnaments[photoBorder] || [];

        const emojiSize = Math.max(26 * scale, Math.min(cellW, cellH) * 0.05);
        const lineWidth = Math.max(5 * scale, 7 * scale);
        const inset = Math.max(10 * scale, 14 * scale);
        const outerInset = Math.max(4 * scale, 6 * scale);
        const drawSticker = (symbol, x, y, size, alpha = 0.45, rotation = 0) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 14 * scale;
            ctx.font = `800 ${size}px "Plus Jakarta Sans", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = theme.accent;
            ctx.fillText(symbol, 0, 0);
            ctx.restore();
        };
        const topY = cellY + Math.max(18 * scale, polTop * 0.45);
        const bottomY = cellY + cellH - Math.max(18 * scale, polBottom * 0.45);
        const leftX = cellX + Math.max(18 * scale, polSide * 0.45);
        const rightX = cellX + cellW - Math.max(18 * scale, polSide * 0.45);
        const centerX = cellX + cellW / 2;
        const centerY = cellY + cellH / 2;

        const drawCorner = (x, y, flipX, flipY, symbol, sizeScale = 1) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(flipX, flipY);
            ctx.font = `800 ${emojiSize * sizeScale}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillText(symbol, 0, 0);
            ctx.restore();
        };

        const drawConfettiDots = (startX, startY, endX, endY, count, color) => {
            ctx.save();
            ctx.fillStyle = color;
            for (let i = 0; i < count; i++) {
                const ratio = count === 1 ? 0 : i / (count - 1);
                const x = startX + (endX - startX) * ratio;
                const y = startY + (endY - startY) * ratio;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(2 * scale, 3 * scale), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };

        const drawSparkLine = (startX, startY, endX, endY, color) => {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(2 * scale, 3 * scale);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.restore();
        };

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 24 * scale;
        ctx.strokeStyle = theme.frame;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(cellX + outerInset, cellY + outerInset, cellW - outerInset * 2, cellH - outerInset * 2);
        ctx.lineWidth = Math.max(2 * scale, 3 * scale);
        ctx.globalAlpha = 0.9;
        ctx.strokeRect(cellX + inset, cellY + inset, cellW - inset * 2, cellH - inset * 2);

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = theme.accentSoft;
        ctx.fillRect(cellX + inset, cellY + inset, cellW - inset * 2, 18 * scale);
        ctx.fillRect(cellX + inset, cellY + cellH - inset - 18 * scale, cellW - inset * 2, 18 * scale);

        if (photoBorder === 'christmas') {
            drawConfettiDots(cellX + inset + 18 * scale, cellY + inset + 9 * scale, cellX + cellW - inset - 18 * scale, cellY + inset + 9 * scale, 10, '#ffd166');
            drawConfettiDots(cellX + inset + 18 * scale, cellY + cellH - inset - 9 * scale, cellX + cellW - inset - 18 * scale, cellY + cellH - inset - 9 * scale, 10, '#ffffff');
            drawSparkLine(cellX + inset + 14 * scale, cellY + inset + 14 * scale, cellX + inset + 46 * scale, cellY + inset + 46 * scale, '#ffd166');
            drawSparkLine(cellX + cellW - inset - 14 * scale, cellY + inset + 14 * scale, cellX + cellW - inset - 46 * scale, cellY + inset + 46 * scale, '#ffd166');
            drawCorner(cellX + outerInset + 26 * scale, cellY + outerInset + 28 * scale, 1, 1, '🎄', 0.7);
            drawCorner(cellX + cellW - outerInset - 26 * scale, cellY + outerInset + 28 * scale, 1, 1, '🎁', 0.7);
            drawCorner(cellX + outerInset + 26 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '✨', 0.7);
            drawCorner(cellX + cellW - outerInset - 26 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '❄️', 0.7);
        } else if (photoBorder === 'halloween') {
            drawSparkLine(cellX + inset + 16 * scale, cellY + inset + 22 * scale, cellX + cellW - inset - 16 * scale, cellY + inset + 22 * scale, '#f7b801');
            drawSparkLine(cellX + inset + 16 * scale, cellY + cellH - inset - 22 * scale, cellX + cellW - inset - 16 * scale, cellY + cellH - inset - 22 * scale, '#f7b801');
            drawCorner(cellX + outerInset + 24 * scale, cellY + outerInset + 28 * scale, 1, 1, '🕸️', 0.7);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + outerInset + 28 * scale, 1, 1, '👻', 0.7);
            drawCorner(cellX + outerInset + 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🎃', 0.75);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🦇', 0.7);
        } else if (photoBorder === 'newyear') {
            drawConfettiDots(cellX + inset + 18 * scale, cellY + inset + 10 * scale, cellX + cellW - inset - 18 * scale, cellY + inset + 10 * scale, 12, '#ffffff');
            drawConfettiDots(cellX + inset + 18 * scale, cellY + cellH - inset - 10 * scale, cellX + cellW - inset - 18 * scale, cellY + cellH - inset - 10 * scale, 12, '#ffd60a');
            drawSparkLine(cellX + cellW * 0.5, cellY + inset + 10 * scale, cellX + cellW * 0.5, cellY + inset + 54 * scale, '#ffffff');
            drawCorner(cellX + outerInset + 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '🎆', 0.75);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '✨', 0.8);
            drawCorner(cellX + outerInset + 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🎊', 0.75);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🎉', 0.75);
        } else if (photoBorder === 'birthday') {
            drawConfettiDots(cellX + inset + 16 * scale, cellY + inset + 10 * scale, cellX + cellW - inset - 16 * scale, cellY + inset + 10 * scale, 14, '#ffffff');
            drawConfettiDots(cellX + inset + 16 * scale, cellY + cellH - inset - 10 * scale, cellX + cellW - inset - 16 * scale, cellY + cellH - inset - 10 * scale, 14, '#ffd166');
            drawCorner(cellX + outerInset + 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '🎈', 0.75);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '🎂', 0.72);
            drawCorner(cellX + outerInset + 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🎉', 0.75);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🧁', 0.72);
        } else if (photoBorder === 'romantic') {
            drawSparkLine(cellX + inset + 18 * scale, cellY + inset + 16 * scale, cellX + cellW - inset - 18 * scale, cellY + inset + 16 * scale, '#ffffff');
            drawSparkLine(cellX + inset + 18 * scale, cellY + cellH - inset - 16 * scale, cellX + cellW - inset - 18 * scale, cellY + cellH - inset - 16 * scale, '#ffffff');
            drawCorner(cellX + outerInset + 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '💖', 0.8);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '🌹', 0.78);
            drawCorner(cellX + outerInset + 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '💕', 0.8);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '💌', 0.78);
        } else if (photoBorder === 'summer') {
            drawConfettiDots(cellX + inset + 18 * scale, cellY + inset + 12 * scale, cellX + cellW - inset - 18 * scale, cellY + inset + 12 * scale, 12, '#ffffff');
            drawSparkLine(cellX + inset + 18 * scale, cellY + cellH - inset - 18 * scale, cellX + cellW - inset - 18 * scale, cellY + cellH - inset - 18 * scale, '#ffffff');
            drawCorner(cellX + outerInset + 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '☀️', 0.8);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + outerInset + 24 * scale, 1, 1, '🌴', 0.78);
            drawCorner(cellX + outerInset + 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🏖️', 0.8);
            drawCorner(cellX + cellW - outerInset - 24 * scale, cellY + cellH - outerInset - 18 * scale, 1, 1, '🍍', 0.78);
        }

        ornaments.forEach((ornament, index) => {
            const x = ornament.slot === 'left' ? leftX : ornament.slot === 'right' ? rightX : centerX;
            const y = ornament.slot === 'top' ? topY : ornament.slot === 'bottom' ? bottomY : centerY;
            const size = emojiSize * ornament.size;
            drawSticker(ornament.symbol, x, y, size, ornament.alpha, ornament.rotate + (index % 2 === 0 ? -0.04 : 0.04));
        });

        ctx.font = `700 ${emojiSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = theme.accent;
        ctx.fillText(theme.symbol, cellX + inset + 20 * scale, cellY + inset + 18 * scale);
        ctx.fillText(theme.symbol2, cellX + cellW - inset - 20 * scale, cellY + inset + 18 * scale);
        ctx.fillText(theme.symbol3, cellX + inset + 20 * scale, cellY + cellH - inset - 18 * scale);
        ctx.fillText(theme.symbol4, cellX + cellW - inset - 20 * scale, cellY + cellH - inset - 18 * scale);

        ctx.restore();
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
            } else if (borderPresets[photoBorder]) {
                drawSpecialBorderDecorations(ctx, photoBorder, cellX, cellY, metrics.cellW, metrics.cellH, metrics.polTop, metrics.polBottom, metrics.polSide, scale);
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

        const mainLabel = String(text || 'PHOTOBOOTHAJAH').trim().toUpperCase();
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
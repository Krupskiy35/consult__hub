
/* CONSULT HUB — PARTICLE DISSOLVE
   Intro: particles assemble into logo and wordmark.
   Rest: crisp white-to-blue gradient.
   Hover: local dissolve into flying gradient particles.
   Exit: smooth reassembly.
*/

(() => {
    'use strict';

    const canvas = document.getElementById('consult-particles-canvas');
    if (!canvas || canvas.dataset.ready) return;

    const box = canvas.closest('.consult-particles');
    if (!box) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const mask = document.createElement('canvas');
    const mc = mask.getContext('2d', { willReadFrequently: true });
    const gradientMask = document.createElement('canvas');
    const gc = gradientMask.getContext('2d');

    if (!ctx || !mc || !gc) return;
    canvas.dataset.ready = '1';

    const CFG = {
        logoSrc: 'assets/consult-symbol.webp',
        text: box.dataset.particlesText || 'CONSULT HUB',
        font: 'Open Sans, sans-serif',
        weight: 700,
        gradientStart: '#FFFFFF',
        gradientMiddle: '#C8EEFF',
        gradientEnd: '#38BDF8',

        // Current wordmark proportions
        textStretchY: 1,
        textOffsetY: 45,

        // Intro animation
        introMs: 2800,
        introScatter: 900,
        introCount: 18500,
        introDotSize: 3.5,

        // Hover dissolve
        hoverRadius: 115,
        hoverPush: 95,
        hoverGap: 2,
        hoverDotSize: 1.5,
        hoverEase: 0.12,
        scatterStrength: 1.0,

        // Particle physics
        spring: 0.055,
        damping: 0.82,
        turbulence: 0.95,

        dprMax: 2
    };

    const logo = new Image();

    let logoReady = false;
    let W = 1;
    let H = 1;
    let dpr = 1;

    let points = [];
    let intro = [];
    let particles = [];

    let elapsed = 0;
    let startedAt = null;
    let finished = false;

    let raf = 0;
    let visible = true;
    let hoverStrength = 0;
    let previousTime = 0;

    const pointer = {
        x: -10000,
        y: -10000,
        active: false
    };

    const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    const clamp = (x, a = 0, b = 1) =>
        Math.max(a, Math.min(b, x));

    const ease = x =>
        1 - Math.pow(1 - clamp(x), 3);

    const rand = (a, b) =>
        a + Math.random() * (b - a);

    function schedule() {
        if (!raf && visible) {
            raf = requestAnimationFrame(tick);
        }
    }

    function dot(x, y, size) {
        ctx.fillRect(
            x - size / 2,
            y - size / 2,
            size,
            size
        );
    }

    function rebuild() {
        const r = box.getBoundingClientRect();

        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height));

        dpr = Math.min(
            window.devicePixelRatio || 1,
            CFG.dprMax
        );

        canvas.width = mask.width = gradientMask.width = Math.round(W * dpr);
        canvas.height = mask.height = gradientMask.height = Math.round(H * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        mc.setTransform(dpr, 0, 0, dpr, 0, 0);
        gc.setTransform(dpr, 0, 0, dpr, 0, 0);

        mc.clearRect(0, 0, W, H);

        const parent = box.parentElement;
        const symbolSlot = parent.querySelector('.hero-symbol-slot');
        const wordSlot = parent.querySelector('.hero-wordmark-slot');

        if (!symbolSlot || !wordSlot) return;

        const base = box.getBoundingClientRect();
        const sr = symbolSlot.getBoundingClientRect();
        const wr = wordSlot.getBoundingClientRect();

        const mobile = window.innerWidth <= 760
        const tablet = window.innerWidth > 760 && window.innerWidth <= 1100;

        // LOGO POSITION
        const logoSize = Math.min(sr.width, sr.height) * 1.25;

        const logoX =
            sr.left - base.left +
            (sr.width - logoSize) / 2;

        const logoY =
            sr.top - base.top +
            (sr.height - logoSize) / 2 +
            (mobile ? 20 : 0);

        // OPEN SANS WORDMARK
        const textPad = mobile ? 2 : 3;
        const available = Math.max(1, wr.width - textPad * 2);

        let size = Math.min(
            wr.height * (mobile ? 1.05 : 0.82),
            mobile ? 85 : 230
        );

        mc.font = `${CFG.weight} ${size}px ${CFG.font}`;

        size *= Math.min(
            1,
            available / Math.max(1, mc.measureText(CFG.text).width)
        );

        mc.font = `${CFG.weight} ${size}px ${CFG.font}`;
        mc.letterSpacing = '-2px';

        const metrics = mc.measureText(CFG.text);
        const textWidth = metrics.width;

        const ascent =
            metrics.actualBoundingBoxAscent || size * 0.74;

        const descent =
            metrics.actualBoundingBoxDescent || size * 0.04;

        const textHeight = ascent + descent;

        const textX =
            wr.left - base.left +
            (mobile
                ? (wr.width - textWidth) / 2
                : tablet
                    ? (wr.width - textWidth) / 2
                    : textPad);

        const textY =
            wr.top - base.top +
            (wr.height - textHeight) / 2 +
            (mobile ? -2 : tablet ? -15 : CFG.textOffsetY);

        mc.fillStyle = '#ffffff';
        mc.textBaseline = 'alphabetic';
        mc.textAlign = 'left';

        mc.save();
        mc.translate(0, textY);
        mc.scale(1, CFG.textStretchY);
        mc.fillText(
            CFG.text,
            textX,
            ascent / CFG.textStretchY
        );
        mc.restore();

        // LOGO ALPHA MASK
        if (logoReady && logoSize > 0) {
            const tmp = document.createElement('canvas');

            tmp.width = tmp.height = Math.max(
                1,
                Math.round(logoSize * dpr)
            );

            const tc = tmp.getContext('2d');

            if (tc) {
                tc.setTransform(dpr, 0, 0, dpr, 0, 0);
                tc.drawImage(logo, 0, 0, logoSize, logoSize);

                tc.globalCompositeOperation = 'source-in';
                tc.fillStyle = '#ffffff';
                tc.fillRect(0, 0, logoSize, logoSize);

                mc.drawImage(
                    tmp,
                    logoX,
                    logoY,
                    logoSize,
                    logoSize
                );
            }
        }

        // Two independent left-to-right gradients: logo and wordmark.
        // Draw colors first, then clip them to the original alpha mask.
        gc.globalCompositeOperation = 'source-over';
        gc.clearRect(0, 0, W, H);

        const symbolGradient = createHorizontalGradient(
            gc, logoX, logoX + logoSize
        );
        gc.fillStyle = symbolGradient;
        gc.fillRect(logoX, 0, logoSize, H);

        const wordGradient = createHorizontalGradient(
            gc, textX, textX + textWidth
        );
        gc.fillStyle = wordGradient;
        gc.fillRect(textX, 0, textWidth, H);

        gc.globalCompositeOperation = 'destination-in';
        gc.drawImage(mask, 0, 0, W, H);
        gc.globalCompositeOperation = 'source-over';

        // SAMPLE PARTICLES FOR HOVER
        const pixels = mc.getImageData(
            0, 0, mask.width, mask.height
        ).data;

        points = [];

        for (let y = CFG.hoverGap / 2; y < H; y += CFG.hoverGap) {
            for (let x = CFG.hoverGap / 2; x < W; x += CFG.hoverGap) {
                const px = Math.min(
                    mask.width - 1,
                    Math.floor(x * dpr)
                );

                const py = Math.min(
                    mask.height - 1,
                    Math.floor(y * dpr)
                );

                const alpha =
                    pixels[(py * mask.width + px) * 4 + 3];

                if (alpha > 125) {
                    points.push({
                        x,
                        y,
                        angle: rand(0, Math.PI * 2),
                        phase: rand(0, Math.PI * 2)
                    });
                }
            }
        }

        particles = [];

        // INTRO PARTICLES
        if (!finished) {
            intro = [];

            const step = Math.max(
                1,
                Math.ceil(points.length / CFG.introCount)
            );

            for (let i = 0; i < points.length; i += step) {
                const p = points[i];
                const angle = rand(0, Math.PI * 2);
                const distance = rand(25, CFG.introScatter);

                intro.push({
                    x0: p.x + Math.cos(angle) * distance,
                    y0: p.y + Math.sin(angle) * distance,
                    x: p.x,
                    y: p.y,
                    delay: rand(0, 0.2)
                });
            }
        }

        draw();
        schedule();
    }

    function createParticles() {
        const radius = CFG.hoverRadius;
        const radius2 = radius * radius;

        const occupied = new Set(
            particles.map(p => p.id)
        );

        for (let i = 0; i < points.length; i++) {
            if (occupied.has(i)) continue;

            const p = points[i];

            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist2 = dx * dx + dy * dy;

            if (dist2 > radius2) continue;

            const distance = Math.sqrt(dist2);
            const force = Math.pow(
                1 - distance / radius,
                0.65
            );

            const angle = p.angle;

            particles.push({
                id: i,
                homeX: p.x,
                homeY: p.y,
                x: p.x,
                y: p.y,
                vx: Math.cos(angle) * CFG.hoverPush * force * 0.08,
                vy: Math.sin(angle) * CFG.hoverPush * force * 0.08,
                phase: p.phase,
                life: 1
            });

            occupied.add(i);
        }
    }

    function updateParticles(dt) {
        const step = Math.min(2.5, dt / 16.67);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy);

            if (
                pointer.active &&
                dist < CFG.hoverRadius &&
                dist > 0
            ) {
                const force =
                    (1 - dist / CFG.hoverRadius) *
                    CFG.scatterStrength;

                p.vx += (dx / dist) * force * 2.5 * step;
                p.vy += (dy / dist) * force * 2.5 * step;

                p.vx += Math.sin(p.phase * 3) *
                    CFG.turbulence * step;

                p.vy += Math.cos(p.phase * 2) *
                    CFG.turbulence * step;
            }

            // RETURN TO ORIGINAL POSITION
            p.vx += (p.homeX - p.x) * CFG.spring * step;
            p.vy += (p.homeY - p.y) * CFG.spring * step;

            p.vx *= Math.pow(CFG.damping, step);
            p.vy *= Math.pow(CFG.damping, step);

            p.x += p.vx * step;
            p.y += p.vy * step;

            const nearHome =
                Math.hypot(p.x - p.homeX, p.y - p.homeY) < 1;

            const slow =
                Math.hypot(p.vx, p.vy) < 0.15;

            if (!pointer.active && nearHome && slow) {
                particles.splice(i, 1);
            }
        }
    }


    function createHorizontalGradient(context, left, right) {
        const gradient = context.createLinearGradient(
            left, 0, Math.max(left + 1, right), 0
        );
        gradient.addColorStop(0, CFG.gradientStart);
        gradient.addColorStop(0.45, CFG.gradientMiddle);
        gradient.addColorStop(1, CFG.gradientEnd);
        return gradient;
    }

    function createLogoGradient(context, width, height) {
        // Used for moving particles; the solid artwork has two
        // independent horizontal gradients created in rebuild().
        return createHorizontalGradient(context, 0, width);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = createLogoGradient(
            ctx,
            canvas.width / dpr,
            canvas.height / dpr
        );

        // INTRO: dots assemble first, then smoothly reveal colored logo.
        if (!finished) {
            const progress = clamp(elapsed / CFG.introMs);
            const assembly = clamp(progress / 0.72);
            const full = ease((progress - 0.68) / 0.32);

            ctx.globalAlpha = 1 - full;
            for (const p of intro) {
                const t = ease(
                    (assembly - p.delay) / (1 - p.delay)
                );
                dot(
                    p.x0 + (p.x - p.x0) * t,
                    p.y0 + (p.y - p.y0) * t,
                    CFG.introDotSize
                );
            }

            ctx.globalAlpha = full;
            ctx.drawImage(gradientMask, 0, 0, W, H);
            ctx.globalAlpha = 1;
            return;
        }

        // Finished logo and wordmark: colored mask, never white mask.
        ctx.drawImage(gradientMask, 0, 0, W, H);

        if (
            hoverStrength <= 0.003 &&
            particles.length === 0
        ) return;

        // LOCAL TRANSPARENT DISSOLVE
        // No black shadow: destination-out removes alpha.
        ctx.globalCompositeOperation = 'destination-out';

        if (hoverStrength > 0.003) {
            const radius = CFG.hoverRadius * hoverStrength;

            if (radius > 1) {
                const gradient = ctx.createRadialGradient(
                    pointer.x,
                    pointer.y,
                    0,
                    pointer.x,
                    pointer.y,
                    radius
                );

                gradient.addColorStop(0, 'rgba(0,0,0,0.98)');
                gradient.addColorStop(0.55, 'rgba(0,0,0,0.9)');
                gradient.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.globalAlpha = hoverStrength;
                ctx.fillStyle = gradient;

                ctx.beginPath();
                ctx.arc(
                    pointer.x,
                    pointer.y,
                    radius,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        // SMALL HOLES AT DISPLACED PARTICLE HOMES
        // This makes the original glyph visibly break apart.
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#000000';

        for (const p of particles) {
            const moved = Math.hypot(
                p.x - p.homeX,
                p.y - p.homeY
            );

            if (moved > 2) {
                ctx.beginPath();
                ctx.arc(
                    p.homeX,
                    p.homeY,
                    CFG.hoverGap * 0.65,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        // FLYING GRADIENT DOTS
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = createLogoGradient(ctx, W, H);

        for (const p of particles) {
            dot(
                p.x,
                p.y,
                CFG.hoverDotSize
            );
        }
    }

    function tick(time) {
        raf = 0;
        if (!visible) return;

        const dt = previousTime
            ? Math.min(50, time - previousTime)
            : 16;

        previousTime = time;

        if (!finished) {
            if (startedAt === null) {
                startedAt = time - elapsed;
            }

            elapsed = time - startedAt;

            if (elapsed >= CFG.introMs || reduce.matches) {
                elapsed = CFG.introMs;
                finished = true;
                intro = [];
            }

            draw();

            if (!finished) schedule();
            return;
        }

        const target =
            pointer.active && !reduce.matches ? 1 : 0;

        const blend =
            1 - Math.pow(1 - CFG.hoverEase, dt / 16.67);

        hoverStrength +=
            (target - hoverStrength) * blend;

        if (Math.abs(hoverStrength - target) < 0.003) {
            hoverStrength = target;
        }

        if (pointer.active && !reduce.matches) {
            createParticles();
        }

        if (particles.length) {
            updateParticles(dt);
        }

        draw();

        if (
            pointer.active ||
            hoverStrength > 0.003 ||
            particles.length
        ) {
            schedule();
        }
    }

    function setPointer(e) {
        const r = canvas.getBoundingClientRect();

        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
    }

    const interactionArea = box.parentElement;

    interactionArea.addEventListener(
        'pointermove',
        e => {
            if (!finished || e.pointerType === 'touch') return;

            setPointer(e);
            pointer.active = true;
            schedule();
        },
        { passive: true }
    );

    interactionArea.addEventListener('pointerleave', () => {
        pointer.active = false;
        schedule();
    });

    interactionArea.addEventListener(
        'pointerdown',
        e => {
            if (e.pointerType !== 'touch' || !finished) return;

            setPointer(e);
            pointer.active = true;
            schedule();
        },
        { passive: true }
    );

    function release() {
        pointer.active = false;
        schedule();
    }

    interactionArea.addEventListener('pointerup', release);
    interactionArea.addEventListener('pointercancel', release);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            const next = entries[0]?.isIntersecting ?? true;

            if (next === visible) return;

            visible = next;

            if (!visible) {
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                startedAt = null;
                previousTime = 0;
            } else {
                draw();
                schedule();
            }
        }).observe(box);
    }

    let resizeFrame = 0;

    const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(rebuild);
    });

    resizeObserver.observe(box);

    async function init() {
        try {
            await document.fonts.load(
                `${CFG.weight} 100px Open Sans`
            );

            await document.fonts.ready;
        } catch (_) {}

        logo.onload = () => {
            logoReady = true;
            rebuild();
        };

        logo.onerror = () => {
            console.warn(
                'CONSULT HUB: missing logo',
                CFG.logoSrc
            );
        };

        logo.src = CFG.logoSrc;

        if (reduce.matches) finished = true;

        rebuild();
    }

    init();
})();

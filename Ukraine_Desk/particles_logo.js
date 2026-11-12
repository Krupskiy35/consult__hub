
(() => {
    'use strict';

    const canvas = document.getElementById('ccipu-logo-canvas');
    if (!canvas || canvas.dataset.ready) return;

    const box = canvas.closest('.hero-particle-logo');
    if (!box) return;

    const ctx = canvas.getContext('2d', { alpha: true });

    const mask = document.createElement('canvas');
    const mc = mask.getContext('2d', {
        willReadFrequently: true
    });

    if (!ctx || !mc) return;

    canvas.dataset.ready = '1';

    const CFG = {
        // INTRO — як на Services
        introMs: 2800,
        introScatter: 900,
        introCount: 18500,
        introDotSize: 3.5,

        // HOVER — як на Services
        hoverRadius: 115,
        hoverPush: 95,
        hoverGap: 2,
        hoverDotSize: 1.5,
        hoverEase: 0.12,
        scatterStrength: 1,

        // PHYSICS
        spring: 0.055,
        damping: 0.82,
        turbulence: 0.95,

        dprMax: 2
    };

    const image = new Image();

    const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    );

    const clamp = (x, a = 0, b = 1) =>
        Math.max(a, Math.min(b, x));

    const ease = x =>
        1 - Math.pow(1 - clamp(x), 3);

    const rand = (a, b) =>
        a + Math.random() * (b - a);

    let W = 1;
    let H = 1;
    let dpr = 1;
    let bounds = null;

    let points = [];
    let intro = [];
    let particles = [];

    let elapsed = 0;
    let startedAt = null;
    let finished = reduce.matches;

    let raf = 0;
    let visible = true;
    let hoverStrength = 0;
    let previousTime = 0;

    const pointer = {
        x: -10000,
        y: -10000,
        active: false
    };

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

    // Знаходимо реальні межі логотипа,
    // ігноруючи прозорі поля зображення.

    function getBounds() {
        const c = document.createElement('canvas');

        c.width = image.naturalWidth;
        c.height = image.naturalHeight;

        const cx = c.getContext('2d', {
            willReadFrequently: true
        });

        cx.drawImage(image, 0, 0);

        const pixels = cx.getImageData(
            0,
            0,
            c.width,
            c.height
        ).data;

        let left = c.width;
        let top = c.height;
        let right = -1;
        let bottom = -1;

        for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
                const i = (y * c.width + x) * 4;

                if (pixels[i + 3] < 30) continue;

                left = Math.min(left, x);
                top = Math.min(top, y);
                right = Math.max(right, x);
                bottom = Math.max(bottom, y);
            }
        }

        if (right < left) {
            return {
                x: 0,
                y: 0,
                w: c.width,
                h: c.height
            };
        }

        return {
            x: left,
            y: top,
            w: right - left + 1,
            h: bottom - top + 1
        };
    }

    // Створення маски логотипа
    // та точок для частинок.

    function rebuild() {
        const r = box.getBoundingClientRect();

        const EXTRA_X = 350;
        const EXTRA_Y = 250;

        W = Math.max(1, Math.round(r.width + EXTRA_X * 2));
        H = Math.max(1, Math.round(r.height + EXTRA_Y * 2));

        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';

        canvas.style.position = 'absolute';
        canvas.style.left = -EXTRA_X + 'px';
        canvas.style.top = -EXTRA_Y + 'px';

        dpr = Math.min(
            window.devicePixelRatio || 1,
            CFG.dprMax
        );

        canvas.width = mask.width = Math.round(W * dpr);
        canvas.height = mask.height = Math.round(H * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        mc.setTransform(dpr, 0, 0, dpr, 0, 0);

        mc.clearRect(0, 0, W, H);

        if (!bounds) {
            bounds = getBounds();
        }

        const scale = Math.min(
            r.width / bounds.w,
            r.height / bounds.h
        );

        const logoW = bounds.w * scale;
        const logoH = bounds.h * scale;

// Зміщення логотипа
        const isTabletOrMobile = window.innerWidth <= 1100;

        const logoShiftX = isTabletOrMobile ? 0 : -20;

        const x = EXTRA_X
            + (isTabletOrMobile ? (r.width - logoW) / 2 : 0)
            + logoShiftX;

        const y = EXTRA_Y + (r.height - logoH) / 2;

        mc.drawImage(
            image,
            bounds.x,
            bounds.y,
            bounds.w,
            bounds.h,
            x,
            y,
            logoW,
            logoH
        );

        const pixels = mc.getImageData(
            0,
            0,
            mask.width,
            mask.height
        ).data;

        points = [];

        for (
            let py = CFG.hoverGap / 2;
            py < H;
            py += CFG.hoverGap
        ) {
            for (
                let px = CFG.hoverGap / 2;
                px < W;
                px += CFG.hoverGap
            ) {
                const ix = Math.min(
                    mask.width - 1,
                    Math.floor(px * dpr)
                );

                const iy = Math.min(
                    mask.height - 1,
                    Math.floor(py * dpr)
                );

                const i = (iy * mask.width + ix) * 4;

                if (pixels[i + 3] <= 125) continue;

                points.push({
                    x: px,
                    y: py,

                    color: `rgba(
            ${pixels[i]},
            ${pixels[i + 1]},
            ${pixels[i + 2]},
            ${pixels[i + 3] / 255}
          )`,

                    angle: rand(0, Math.PI * 2),
                    phase: rand(0, Math.PI * 2)
                });
            }
        }

        particles = [];

        // Початкове розсіювання

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

                    color: p.color,
                    delay: rand(0, 0.2)
                });
            }
        }

        draw();
        schedule();
    }

    // Створення частинок біля курсора

    function createParticles() {
        const occupied = new Set(
            particles.map(p => p.id)
        );

        const radius2 = CFG.hoverRadius ** 2;

        for (let i = 0; i < points.length; i++) {
            if (occupied.has(i)) continue;

            const p = points[i];

            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;

            const dist2 = dx * dx + dy * dy;

            if (dist2 > radius2) continue;

            const force = Math.pow(
                1 - Math.sqrt(dist2) / CFG.hoverRadius,
                0.65
            );

            particles.push({
                id: i,

                homeX: p.x,
                homeY: p.y,

                x: p.x,
                y: p.y,

                vx:
                    Math.cos(p.angle) *
                    CFG.hoverPush *
                    force *
                    0.08,

                vy:
                    Math.sin(p.angle) *
                    CFG.hoverPush *
                    force *
                    0.08,

                color: p.color,
                phase: p.phase
            });

            occupied.add(i);
        }
    }

    // Фізика розльоту та повернення

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

                p.vx +=
                    (dx / dist) * force * 2.5 * step;

                p.vy +=
                    (dy / dist) * force * 2.5 * step;

                p.vx +=
                    Math.sin(p.phase * 3) *
                    CFG.turbulence *
                    step;

                p.vy +=
                    Math.cos(p.phase * 2) *
                    CFG.turbulence *
                    step;
            }

            // Пружне повернення

            p.vx +=
                (p.homeX - p.x) *
                CFG.spring *
                step;

            p.vy +=
                (p.homeY - p.y) *
                CFG.spring *
                step;

            p.vx *= Math.pow(CFG.damping, step);
            p.vy *= Math.pow(CFG.damping, step);

            p.x += p.vx * step;
            p.y += p.vy * step;

            const nearHome =
                Math.hypot(
                    p.x - p.homeX,
                    p.y - p.homeY
                ) < 1;

            const slow =
                Math.hypot(p.vx, p.vy) < 0.15;

            if (!pointer.active && nearHome && slow) {
                particles.splice(i, 1);
            }
        }
    }

    // Малювання логотипа та ефектів

    function draw() {
        ctx.clearRect(0, 0, W, H);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // INTRO: складання логотипа з частинок

        if (!finished) {
            const progress = clamp(
                elapsed / CFG.introMs
            );

            const assembly = clamp(
                progress / 0.72
            );

            const full = ease(
                (progress - 0.68) / 0.32
            );

            ctx.globalAlpha = 1 - full;

            for (const p of intro) {
                const t = ease(
                    (assembly - p.delay) /
                    (1 - p.delay)
                );

                ctx.fillStyle = p.color;

                dot(
                    p.x0 + (p.x - p.x0) * t,
                    p.y0 + (p.y - p.y0) * t,
                    CFG.introDotSize
                );
            }

            // Плавний перехід у чіткий логотип

            ctx.globalAlpha = full;
            ctx.drawImage(mask, 0, 0, W, H);

            ctx.globalAlpha = 1;
            return;
        }

        // Суцільний логотип

        ctx.drawImage(mask, 0, 0, W, H);

        if (
            hoverStrength <= 0.003 &&
            particles.length === 0
        ) {
            return;
        }

        // Локальне розчинення під курсором

        ctx.globalCompositeOperation = 'destination-out';

        if (hoverStrength > 0.003) {
            const radius =
                CFG.hoverRadius * hoverStrength;

            if (radius > 1) {
                const g = ctx.createRadialGradient(
                    pointer.x,
                    pointer.y,
                    0,
                    pointer.x,
                    pointer.y,
                    radius
                );

                g.addColorStop(
                    0,
                    'rgba(0,0,0,0.98)'
                );

                g.addColorStop(
                    0.55,
                    'rgba(0,0,0,0.9)'
                );

                g.addColorStop(
                    1,
                    'rgba(0,0,0,0)'
                );

                ctx.globalAlpha = hoverStrength;
                ctx.fillStyle = g;

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

        // Отвори в місцях, звідки вилетіли частинки

        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#000';

        for (const p of particles) {
            const moved = Math.hypot(
                p.x - p.homeX,
                p.y - p.homeY
            );

            if (moved <= 2) continue;

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

        // Кольорові частинки

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        for (const p of particles) {
            ctx.fillStyle = p.color;

            dot(
                p.x,
                p.y,
                CFG.hoverDotSize
            );
        }
    }

    // Головний цикл анімації

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

            if (
                elapsed >= CFG.introMs ||
                reduce.matches
            ) {
                elapsed = CFG.introMs;
                finished = true;
                intro = [];
            }

            draw();

            if (!finished) schedule();
            return;
        }

        const target =
            pointer.active && !reduce.matches
                ? 1
                : 0;

        const blend =
            1 -
            Math.pow(
                1 - CFG.hoverEase,
                dt / 16.67
            );

        hoverStrength +=
            (target - hoverStrength) * blend;

        if (
            Math.abs(hoverStrength - target) < 0.003
        ) {
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

    // Координати курсора

    function setPointer(e) {
        const r = canvas.getBoundingClientRect();

        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
    }

    // Взаємодія з Hero

    const area = box.parentElement;

    area.addEventListener(
        'pointermove',
        e => {
            if (
                !finished ||
                e.pointerType === 'touch'
            ) {
                return;
            }

            setPointer(e);
            pointer.active = true;
            schedule();
        },
        { passive: true }
    );

    area.addEventListener(
        'pointerleave',
        () => {
            pointer.active = false;
            schedule();
        }
    );

    area.addEventListener(
        'pointerdown',
        e => {
            if (
                e.pointerType !== 'touch' ||
                !finished
            ) {
                return;
            }

            setPointer(e);
            pointer.active = true;
            schedule();
        },
        { passive: true }
    );

    const release = () => {
        pointer.active = false;
        schedule();
    };

    area.addEventListener('pointerup', release);
    area.addEventListener('pointercancel', release);

    // Зупинка анімації поза екраном

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            const next =
                entries[0]?.isIntersecting ?? true;

            if (next === visible) return;

            visible = next;

            if (!visible) {
                if (raf) {
                    cancelAnimationFrame(raf);
                }

                raf = 0;
                startedAt = null;
                previousTime = 0;
            } else {
                draw();
                schedule();
            }
        }).observe(box);
    }

    // Адаптивний перерахунок

    let resizeFrame = 0;

    const observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);

        resizeFrame = requestAnimationFrame(rebuild);
    });

    observer.observe(box);

    // Завантаження оригінального логотипа

    image.onload = rebuild;

    image.onerror = () => {
        console.error(
            'CCIPU logo not loaded:',
            image.src
        );
    };

    image.src = '../assets/CCIPU_logo.webp';
})();

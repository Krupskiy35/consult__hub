
/* CONSULT HUB / INDlSEA-STYLE SCROLL SPINE — v3 */
(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('consult-spine');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    const startRing = document.createElementNS(ns, 'circle');
    const staticStem = document.createElementNS(ns, 'path');
    svg.append(staticStem, path, startRing);
    main.prepend(svg);
    const sections = (main.dataset.flowSections || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!sections.length) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateIdleAnimation() {
        const atTop = window.scrollY < 5;

        svg.classList.toggle(
            'is-idle',
            atTop && !reduced
        );
    }

    window.addEventListener('scroll', updateIdleAnimation, {
        passive: true
    });

    window.addEventListener('load', updateIdleAnimation);

    updateIdleAnimation();

    let total = 1, start = 0, end = 1, pending = false;
    const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
    function smoothPath(points, radius) {
        let d = `M ${points[0][0]} ${points[0][1]}`;
        for(let i=1;i<points.length-1;i++) {
            const a=points[i-1], b=points[i], c=points[i+1];
            const l1=Math.hypot(b[0]-a[0],b[1]-a[1]);
            const l2=Math.hypot(c[0]-b[0],c[1]-b[1]);
            if(l1<1||l2<1) continue;
            const r=Math.min(radius,l1*.40,l2*.45);
            d+=` L ${b[0]+(a[0]-b[0])*r/l1} ${b[1]+(a[1]-b[1])*r/l1}`;
            d+=` Q ${b[0]} ${b[1]} ${b[0]+(c[0]-b[0])*r/l2} ${b[1]+(c[1]-b[1])*r/l2}`;
        }
        return d+` L ${points.at(-1)[0]} ${points.at(-1)[1]}`;
    }
    function build() {
        const w=main.clientWidth, h=main.scrollHeight;
        if(!w||!h) return;
        const origin=main.getBoundingClientRect();
        const blocks = sections
            .flatMap(selector => [
                ...main.querySelectorAll(selector)
            ])
            .map(el => {
                const r = el.getBoundingClientRect();

                return {
                    top: r.top - origin.top,
                    bottom: r.bottom - origin.top,
                    height: r.height
                };
            });
        if(blocks.length<4) return;
        const mobile=w<720, tablet=w<1100;
        const stroke=mobile?12:tablet?17:22;
        const hero=blocks[0];
        const cx=mobile?w-27:w*.78;
        const cy=hero.bottom-(mobile?64:tablet?80:88);
        const radius=mobile?17:tablet?29:39;
        const left=mobile?8:Math.max(42,w*.080), right=mobile?w-8:w*.92;
        // The initial ring is the origin: drawing starts directly beneath it.
        // Route around the OUTSIDE of the Process section, not through its text.
        // The visible ring and vertical stem are already drawn. Scroll animation begins
        // precisely at the bottom of the hero, where the first screenshot arrow points.
        const launchY=hero.bottom; // End the visible stem exactly at the Hero boundary; no blue segment below it on load.
        const pts=[[cx,launchY]];
        let x=cx;
        blocks.slice(1).forEach((b,i)=>{

            const boundary=clamp(b.top+Math.min(24,b.height*.04),0,h-40);
            const target=i%2===0?right:left;
            pts.push([x,boundary],[target,boundary]);
            x=target;
            const next=blocks[i+2];
            if(next && i!==2) pts.push([x,Math.max(boundary+35,next.top-55)]);
            else if(!next) pts.push([x,Math.min(h-75,b.bottom-75)]);
        });
        const mainLine=smoothPath(pts,mobile?24:120);
        // Ring is an independent SVG element so the top remains visible before scroll.
        svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
        svg.style.height=`${h}px`;
        startRing.setAttribute('cx',cx);
        startRing.setAttribute('cy',cy);
        startRing.setAttribute('r',radius);
        startRing.style.strokeWidth=stroke;
        staticStem.setAttribute('d',`M ${cx} ${cy+radius} L ${cx} ${launchY}`);
        staticStem.style.strokeWidth=stroke;
        path.setAttribute('d',mainLine);
        path.style.strokeWidth=stroke;
        total=path.getTotalLength();
        path.style.strokeDasharray=`${total} ${total}`;
        // At page load the entire animated path is hidden; only the ring and stem show.
        // Start drawing from the Hero boundary on the very first downward scroll.
        start=0;
        end=Math.max(1, origin.top+scrollY+h-innerHeight*.75);
        update();
    }
    function strokeCapGuard() { return 16; }
    function update() {
        const p=clamp((scrollY-start)/Math.max(1,end-start),0,1);
        // A small extra offset keeps the rounded line cap fully hidden at scrollY=0.
        path.style.strokeDashoffset=`${p===0 ? total+strokeCapGuard() : total*(1-p)}`;
        pending=false;
    }
    addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update)}},{passive:true});
    let resizeHandle;
    addEventListener('resize',()=>{clearTimeout(resizeHandle);resizeHandle=setTimeout(build,140)});
    addEventListener('load',build);
    if(document.fonts)document.fonts.ready.then(build);
    build();
})();

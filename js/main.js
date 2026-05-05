/* ═══════════════════════════════════════════════════════════════
   CardioSense Research Website — Main JavaScript
   Project: 25-26J-337 | SLIIT
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Navbar Scroll Effect ───────────────────────────────────── */
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
}

/* ── Mobile Menu ─────────────────────────────────────────────── */
const hamburger = document.querySelector('.hamburger');
const navLinks  = document.querySelector('.nav-links');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            hamburger.classList.remove('open');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
}

/* ── Active Nav Link ─────────────────────────────────────────── */
(function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href === path || (path === '' && href === 'index.html')) {
            a.classList.add('active');
        }
    });
})();

/* ── Scroll Reveal ───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => {
    revealObserver.observe(el);
});

/* ── Counter Animation ───────────────────────────────────────── */
function animateCounter(el, target, suffix = '', duration = 2000) {
    const start     = performance.now();
    const isDecimal = target % 1 !== 0;
    function update(time) {
        const elapsed  = Math.min(time - start, duration);
        const progress = easeOutExpo(elapsed / duration);
        const current  = progress * target;
        el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
        if (elapsed < duration) requestAnimationFrame(update);
        else el.textContent = target + suffix;
    }
    requestAnimationFrame(update);
}
function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.target || 0);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        counterObserver.unobserve(el);
    });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

/* ── ECG Canvas Animation ────────────────────────────────────── */
function initECG() {
    const canvas = document.getElementById('ecgCanvas');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    let W, H, offset = 0;

    function resize() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* ECG waveform template (normalised 0-1 x, -1 to 1 y) */
    const WAVE = [
        [0,0],[0.05,0],[0.08,0.08],[0.1,0],[0.12,-0.12],[0.15,1],
        [0.18,-0.5],[0.22,0.25],[0.28,0],[0.35,0.15],[0.4,0.12],
        [0.45,0],[0.5,0],[1,0]
    ];

    function ecgY(x) {
        /* interpolate between WAVE segments */
        for (let i = 0; i < WAVE.length - 1; i++) {
            const [x0,y0] = WAVE[i];
            const [x1,y1] = WAVE[i+1];
            if (x >= x0 && x <= x1) {
                const t = (x - x0) / (x1 - x0);
                return y0 + t * (y1 - y0);
            }
        }
        return 0;
    }

    let raf;
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const numLines = Math.ceil(H / 80) + 1;
        for (let line = 0; line < numLines; line++) {
            const yBase = line * 80 + (offset % 80);
            const alpha = 0.12 - line * 0.015;
            if (alpha <= 0) continue;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(230,57,70,${Math.max(0, alpha)})`;
            ctx.lineWidth   = line === 0 ? 1.5 : 0.8;
            ctx.shadowBlur  = line === 0 ? 8 : 0;
            ctx.shadowColor = 'rgba(230,57,70,0.6)';

            const segW = 320;
            const numSegs = Math.ceil(W / segW) + 2;
            for (let seg = -1; seg < numSegs; seg++) {
                const xStart = seg * segW - (offset % segW);
                for (let px = 0; px <= segW; px++) {
                    const nx = px / segW;
                    const ny = ecgY(nx);
                    const cx = xStart + px;
                    const cy = yBase - ny * 28;
                    if (px === 0) ctx.moveTo(cx, cy);
                    else ctx.lineTo(cx, cy);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        offset += 0.6;
        raf = requestAnimationFrame(draw);
    }
    draw();

    /* stop when not visible */
    const canvasObserver = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!raf) draw(); }
        else { cancelAnimationFrame(raf); raf = null; }
    });
    canvasObserver.observe(canvas);
}
initECG();

/* ── Particle Background ─────────────────────────────────────── */
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const PARTICLES = [];
    const COUNT = 60;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    class Particle {
        constructor() { this.reset(true); }
        reset(init) {
            this.x  = Math.random() * W;
            this.y  = init ? Math.random() * H : H + 10;
            this.r  = Math.random() * 1.5 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = -(Math.random() * 0.4 + 0.1);
            this.alpha = Math.random() * 0.4 + 0.1;
            this.color = Math.random() > 0.5 ? '67,97,238' : '230,57,70';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -10) this.reset(false);
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < COUNT; i++) PARTICLES.push(new Particle());

    /* Draw connections */
    function drawConnections() {
        for (let i = 0; i < PARTICLES.length; i++) {
            for (let j = i + 1; j < PARTICLES.length; j++) {
                const dx = PARTICLES[i].x - PARTICLES[j].x;
                const dy = PARTICLES[i].y - PARTICLES[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(67,97,238,${0.04 * (1 - dist/120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(PARTICLES[i].x, PARTICLES[i].y);
                    ctx.lineTo(PARTICLES[j].x, PARTICLES[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        drawConnections();
        PARTICLES.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}
initParticles();

/* ── Smooth Scroll for Anchor Links ─────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        const id  = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const offset = parseInt(getComputedStyle(document.documentElement)
                            .getPropertyValue('--nav-h') || '68');
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
});

/* ── Year in Footer ──────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Typing Effect (Hero) ────────────────────────────────────── */
function initTypingEffect() {
    const el = document.getElementById('typingText');
    if (!el) return;
    const texts = [
        'Cardiovascular Risk Prediction',
        'Chest X-Ray Analysis',
        'Personalized Recommendations',
        'Mental Health Monitoring'
    ];
    let ti = 0, ci = 0, deleting = false;
    const SPEED_TYPE = 70, SPEED_DEL = 35, PAUSE = 2000;

    function type() {
        const current = texts[ti];
        if (deleting) {
            el.textContent = current.substring(0, ci--);
            if (ci < 0) { deleting = false; ti = (ti + 1) % texts.length; setTimeout(type, 400); return; }
        } else {
            el.textContent = current.substring(0, ci++);
            if (ci > current.length) { deleting = true; setTimeout(type, PAUSE); return; }
        }
        setTimeout(type, deleting ? SPEED_DEL : SPEED_TYPE);
    }
    type();
}
initTypingEffect();

/* ── Tab Switcher ────────────────────────────────────────────── */
document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const group  = btn.dataset.tabGroup;
        const target = btn.dataset.tab;
        document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(el => {
            el.classList.remove('active');
        });
        document.querySelectorAll(`[data-tab="${target}"]`).forEach(el => {
            if (el !== btn) el.classList.toggle('active', true);
        });
        btn.classList.add('active');
        document.querySelectorAll(`.tab-panel[data-tab-group="${group}"]`).forEach(panel => {
            panel.style.display = panel.dataset.panel === target ? 'block' : 'none';
        });
    });
});

/* ── Contact Form Handler ────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('[type=submit]');
        const orig = btn.innerHTML;
        btn.innerHTML = '✓ Message Sent!';
        btn.style.background = 'linear-gradient(135deg,#06d6a0,#4361ee)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 3000);
    });
}

/* ── Tooltip on hover for tech tags ─────────────────────────── */
document.querySelectorAll('[data-tooltip]').forEach(el => {
    const tip = document.createElement('div');
    tip.className = 'tooltip-text';
    tip.textContent = el.dataset.tooltip;
    Object.assign(tip.style, {
        position:'absolute', background:'rgba(11,22,48,0.95)',
        border:'1px solid rgba(255,255,255,0.1)', padding:'4px 10px',
        borderRadius:'6px', fontSize:'0.75rem', color:'#fff',
        whiteSpace:'nowrap', pointerEvents:'none', zIndex:'9999',
        opacity:'0', transition:'opacity 0.2s ease',
    });
    el.style.position = 'relative';
    el.appendChild(tip);
    el.addEventListener('mouseenter', () => { tip.style.opacity = '1'; });
    el.addEventListener('mouseleave', () => { tip.style.opacity = '0'; });
});

/* ── Init reveal for dynamically added content ──────────────── */
window.addEventListener('load', () => {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => {
        if (!el.classList.contains('visible')) revealObserver.observe(el);
    });
});

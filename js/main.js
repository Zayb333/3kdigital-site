/* ─────────────────────────────────────────
   3K Digital — Main JavaScript
   ───────────────────────────────────────── */

// ─── NAV SCROLL ───
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ─── PARTICLE CANVAS ───
(function () {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 1.5 + 0.3;
      this.speed = Math.random() * 0.3 + 0.1;
      this.angle = Math.random() * Math.PI * 2;
      this.drift = (Math.random() - 0.5) * 0.01;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.hue = Math.random() > 0.5 ? '0,200,255' : '168,85,247';
    }
    update() {
      this.angle += this.drift;
      this.x += Math.cos(this.angle) * this.speed;
      this.y -= this.speed * 0.5;
      if (this.y < -10 || this.x < -10 || this.x > W + 10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.hue},${this.alpha})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, () => new Particle());
    loop();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    // Draw subtle connections
    particles.forEach((p, i) => {
      particles.slice(i + 1, i + 5).forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(0,200,255,${0.05 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  init();
})();

// ─── SCROLL REVEAL ───
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => io.observe(el));

// ─── MOBILE NAV ───
document.getElementById('hamburger').addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  if (!links) return;
  const isOpen = links.style.display === 'flex';
  links.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) {
    Object.assign(links.style, {
      flexDirection: 'column',
      position: 'absolute',
      top: '72px',
      left: '0',
      right: '0',
      background: 'rgba(5,5,8,0.98)',
      padding: '24px',
      gap: '20px',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)'
    });
  }
});

// ─── TOOL CARD 3D TILT ───
document.querySelectorAll('.tool-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    card.style.transition = 'box-shadow 0.35s, border-color 0.35s';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'all 0.35s ease';
  });
});

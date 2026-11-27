// Pluie de confettis quand un joueur répond juste (aux couleurs du jeu).
// Utilisation : launchConfetti() ou launchConfetti(300) pour en faire plus.

const COLORS = ['#F88C2F', '#EFC6E9', '#C0D6FF', '#FCF4C0', '#6D0101', '#3B174F'];

export function launchConfetti(amount = 140) {
  // Si l'utilisateur a demandé moins d'animations dans son système, on ne fait rien
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Une toile (canvas) transparente par-dessus toute la page
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Création des confettis : ils partent du haut de l'écran
  const pieces = [];
  for (let i = 0; i < amount; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.4,
      size: 6 + Math.random() * 8,
      speedX: -2 + Math.random() * 4,
      speedY: 3 + Math.random() * 4,
      angle: Math.random() * Math.PI,
      spin: -0.2 + Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.3, // 30 % de ronds, le reste en petits rectangles
    });
  }

  const start = performance.now();
  const DURATION = 2200; // en millisecondes

  function draw(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION); // disparaissent doucement

    for (const p of pieces) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.05; // gravité
      p.angle += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }

    if (elapsed < DURATION) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(draw);
}



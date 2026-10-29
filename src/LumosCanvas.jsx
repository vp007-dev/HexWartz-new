import React, { useEffect, useRef } from 'react';

export default function LumosCanvas({ enabled = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates for gentle interactive repelling/attracting
    const mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Particle pool
    const particleCount = Math.min(65, Math.floor(width / 24));
    const particles = [];
    const colors = [
      'rgba(242, 190, 66, ',   // Gold
      'rgba(255, 230, 118, ',  // Bright Arcane Gold
      'rgba(204, 162, 98, ',   // Antique Amber
      'rgba(217, 120, 108, ',  // Crimson accent
      'rgba(255, 249, 235, '   // Ivory
    ];
    // Keep all pre-rendered glows in one texture to avoid switching images for each particle.
    const sprites = document.createElement('canvas');
    sprites.width = particleCount * 32;
    sprites.height = 32;
    const spriteCtx = sprites.getContext('2d');
    spriteCtx.shadowBlur = 8;
    spriteCtx.shadowColor = 'rgba(242, 190, 66, 0.4)';

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 1.8 + 0.6;
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      // Rasterize each glow once instead of running a blur for every particle on every frame.
      spriteCtx.beginPath();
      spriteCtx.arc(i * 32 + 16, 16, radius, 0, Math.PI * 2);
      spriteCtx.fillStyle = `${baseColor}1)`;
      spriteCtx.fill();
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        spriteX: i * 32,
        alpha: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.2, // subtle upward drift
        pulsing: Math.random() * Math.PI,
        pulseSpeed: 0.02 + Math.random() * 0.03
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.pulsing += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulsing) * 0.25;
        const clampedAlpha = Math.max(0.05, Math.min(0.85, currentAlpha));

        // Move particle
        p.x += p.speedX;
        p.y += p.speedY;

        // Subtle reaction to mouse
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < 120) {
            const force = (120 - dist) / 120;
            p.x -= (dx / dist) * force * 1.2;
            p.y -= (dy / dist) * force * 1.2;
          }
        }

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.globalAlpha = clampedAlpha;
        ctx.drawImage(sprites, p.spriteX, 0, 32, 32, p.x - 16, p.y - 16, 32, 32);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      cancelAnimationFrame(animationFrameId);
      if (!document.hidden) render();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    if (!document.hidden) render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="lumos-particle-canvas"
      aria-hidden="true"
    />
  );
}

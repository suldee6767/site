import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface PlasmaParticle {
  angle: number;
  distance: number; // distance factor from event horizon
  speed: number;
  size: number;
  color: string;
  alpha: number;
}

export const BlackHoleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // 1. STARFIELD SETUP (blue, red, orange, yellow, white realistic stars)
    const starColors = [
      '#70a5ff', // Blue (O/B type)
      '#90caf9', // Light blue
      '#ffffff', // Crisp white (A type)
      '#fff59d', // Yellow (G type)
      '#ffcc80', // Warm amber / orange (K type)
      '#ff8a65', // Vivid orange
      '#ff5252', // Red giant (M type)
      '#ff7979'  // Soft red
    ];

    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const count = Math.floor((width * height) / 3200); // ~400-500 stars
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.4,
          baseAlpha: Math.random() * 0.7 + 0.25,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
    };
    initStars();

    // 2. ACCRETION DISK BURNING PLASMA PARTICLES
    const plasmaParticles: PlasmaParticle[] = [];
    const plasmaColors = [
      '#ffffff', // white hot
      '#fff176', // bright yellow
      '#ffb300', // golden yellow
      '#ff9100', // vivid orange
      '#ff6d00', // deep burning orange
      '#ff3d00', // fiery red
      '#d50000', // crimson edge
      '#00e5ff'  // relativistic blueshift peak
    ];

    const particleCount = 280;
    for (let i = 0; i < particleCount; i++) {
      const dist = Math.random() * 1.6 + 1.05; // 1.05x to 2.65x black hole radius
      // Relativistic Keplerian physics: closer particles orbit faster
      const speed = (0.012 / Math.sqrt(dist)) * (Math.random() * 0.2 + 0.9);
      plasmaParticles.push({
        angle: Math.random() * Math.PI * 2,
        distance: dist,
        speed: speed,
        size: Math.random() * 3.2 + 1.2,
        color: plasmaColors[Math.floor(Math.random() * plasmaColors.length)],
        alpha: Math.random() * 0.6 + 0.4
      });
    }

    // 3. ANIMATION LOOP
    let rotationAngle = 0;
    let time = 0;

    const render = () => {
      time += 0.02;
      // "not fast not slow" steady celestial rotation
      rotationAngle += 0.007;

      ctx.clearRect(0, 0, width, height);

      // Deep Space background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#040714');
      bgGrad.addColorStop(0.5, '#02040b');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // --- DRAW TWINKLING MULTICOLORED STARS ---
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const twinkle = Math.sin(time * star.twinkleSpeed * 50 + star.twinklePhase);
        const alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle * 0.35));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Extra subtle glow for larger bright stars
        if (star.radius > 1.3 && alpha > 0.6) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha * 0.18;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // --- BLACK HOLE POSITION & SIZE ---
      // Positioned centrally in the viewport with majestic presence
      const cx = width * 0.5;
      const cy = height * 0.42;
      const bhRadius = Math.max(120, Math.min(width, height) * 0.17);
      const diskTilt = 0.32; // perspective squish for accretion disk ellipse
      const diskInclinationAngle = -0.22; // slight tilted roll angle

      // --- STEP 1: OUTER GRAVITATIONAL LENSING GLOW ---
      const outerGlow = ctx.createRadialGradient(
        cx, cy, bhRadius * 0.8,
        cx, cy, bhRadius * 4.2
      );
      outerGlow.addColorStop(0, 'rgba(255, 170, 50, 0.45)');
      outerGlow.addColorStop(0.2, 'rgba(255, 100, 20, 0.28)');
      outerGlow.addColorStop(0.45, 'rgba(200, 40, 20, 0.12)');
      outerGlow.addColorStop(0.75, 'rgba(120, 20, 100, 0.05)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius * 4.2, 0, Math.PI * 2);
      ctx.fill();

      // --- STEP 2: WARPED GRAVITATIONAL LENSING HALO (Interstellar Arc Behind Event Horizon) ---
      // Light from the rear disk bent over the top and bottom of the event horizon
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(diskInclinationAngle);

      // Top gravitational arc (lensed back of disk)
      ctx.beginPath();
      ctx.ellipse(0, -bhRadius * 0.25, bhRadius * 1.85, bhRadius * 1.5, 0, Math.PI * 0.95, Math.PI * 2.05);
      const topArcGrad = ctx.createLinearGradient(-bhRadius * 1.5, 0, bhRadius * 1.5, 0);
      topArcGrad.addColorStop(0, 'rgba(255, 80, 20, 0.7)');
      topArcGrad.addColorStop(0.25, 'rgba(255, 190, 60, 0.95)');
      topArcGrad.addColorStop(0.5, 'rgba(255, 255, 230, 1.0)');
      topArcGrad.addColorStop(0.75, 'rgba(255, 140, 40, 0.85)');
      topArcGrad.addColorStop(1, 'rgba(230, 40, 20, 0.5)');
      ctx.strokeStyle = topArcGrad;
      ctx.lineWidth = bhRadius * 0.28;
      ctx.stroke();

      // Bottom gravitational arc (subtler counter-lens)
      ctx.beginPath();
      ctx.ellipse(0, bhRadius * 0.25, bhRadius * 1.7, bhRadius * 1.35, 0, 0, Math.PI);
      const botArcGrad = ctx.createLinearGradient(-bhRadius * 1.5, 0, bhRadius * 1.5, 0);
      botArcGrad.addColorStop(0, 'rgba(255, 70, 20, 0.45)');
      botArcGrad.addColorStop(0.3, 'rgba(255, 160, 50, 0.6)');
      botArcGrad.addColorStop(0.7, 'rgba(255, 120, 30, 0.55)');
      botArcGrad.addColorStop(1, 'rgba(200, 30, 10, 0.3)');
      ctx.strokeStyle = botArcGrad;
      ctx.lineWidth = bhRadius * 0.2;
      ctx.stroke();

      ctx.restore();

      // --- STEP 3: MAIN ACCRETION DISK (BURNING ENERGY RINGS IN PERSPECTIVE) ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(diskInclinationAngle);
      ctx.scale(1, diskTilt);

      // Draw multi-layered glowing burning gas rings
      const ringGradients = [
        { r: bhRadius * 2.4, w: bhRadius * 0.4, color: 'rgba(255, 90, 20, 0.45)' },
        { r: bhRadius * 2.0, w: bhRadius * 0.35, color: 'rgba(255, 150, 30, 0.75)' },
        { r: bhRadius * 1.6, w: bhRadius * 0.3, color: 'rgba(255, 220, 80, 0.95)' },
        { r: bhRadius * 1.3, w: bhRadius * 0.22, color: 'rgba(255, 255, 230, 1.0)' },
        { r: bhRadius * 1.12, w: bhRadius * 0.12, color: 'rgba(180, 240, 255, 0.95)' } // innermost blueshift
      ];

      for (let i = 0; i < ringGradients.length; i++) {
        const ring = ringGradients[i];
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.w;
        ctx.stroke();
      }

      // Rotating plasma particles inside accretion disk
      for (let i = 0; i < plasmaParticles.length; i++) {
        const p = plasmaParticles[i];
        p.angle += p.speed;

        const rad = bhRadius * p.distance;
        const px = Math.cos(p.angle) * rad;
        const py = Math.sin(p.angle) * rad;

        // Relativistic Doppler boosting: Approaching side (left) is brighter and shifted
        const doppler = Math.cos(p.angle + Math.PI * 0.5); // approaching vs receding
        const brightness = Math.max(0.2, Math.min(1.0, p.alpha + doppler * 0.3));

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = brightness;
        ctx.fill();

        // Filament tails for fast spinning energy feel
        ctx.beginPath();
        ctx.moveTo(px, py);
        const tailX = Math.cos(p.angle - p.speed * 4) * rad;
        const tailY = Math.sin(p.angle - p.speed * 4) * rad;
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      ctx.restore();

      // --- STEP 4: THE EVENT HORIZON (SHADOW OF THE BLACK HOLE) ---
      // Absolute pitch black sphere that swallows all light and cuts through the back disk
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowColor = 'rgba(0, 0, 0, 1)';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      // --- STEP 5: PHOTON SPHERE (RAZOR-SHARP INCANDESCENT INNER RING) ---
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius * 1.03, 0, Math.PI * 2);
      const photonGrad = ctx.createLinearGradient(
        cx - bhRadius, cy,
        cx + bhRadius, cy
      );
      // Doppler blueshift on the left, warm incandescent white/amber on the right
      photonGrad.addColorStop(0, 'rgba(210, 245, 255, 0.98)');
      photonGrad.addColorStop(0.3, 'rgba(255, 255, 240, 1.0)');
      photonGrad.addColorStop(0.65, 'rgba(255, 210, 100, 0.95)');
      photonGrad.addColorStop(1, 'rgba(255, 130, 40, 0.85)');

      ctx.strokeStyle = photonGrad;
      ctx.lineWidth = Math.max(2, bhRadius * 0.035);
      ctx.stroke();

      // --- STEP 6: FOREGROUND ACCRETION DISK PASS (Crossing in front of the Event Horizon) ---
      // The front half of the tilted disk passes over the bottom of the black hole
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(diskInclinationAngle);
      ctx.scale(1, diskTilt);

      // Clip to only draw the front half (y > 0 in tilted space)
      ctx.beginPath();
      ctx.rect(-bhRadius * 3, 0, bhRadius * 6, bhRadius * 3);
      ctx.clip();

      // Render front burning plasma stream
      const frontGrad = ctx.createRadialGradient(0, 0, bhRadius * 1.05, 0, 0, bhRadius * 2.2);
      frontGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
      frontGrad.addColorStop(0.2, 'rgba(255, 190, 50, 0.85)');
      frontGrad.addColorStop(0.5, 'rgba(255, 110, 20, 0.65)');
      frontGrad.addColorStop(0.85, 'rgba(200, 40, 10, 0.35)');
      frontGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, bhRadius * 2.3, 0, Math.PI * 2);
      ctx.fillStyle = frontGrad;
      ctx.fill();

      // Draw foreground plasma particles for 3D depth
      for (let i = 0; i < plasmaParticles.length; i++) {
        const p = plasmaParticles[i];
        const rad = bhRadius * p.distance;
        const py = Math.sin(p.angle) * rad;
        if (py > 0) { // Only front side
          const px = Math.cos(p.angle) * rad;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, p.alpha * 1.3);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      aria-hidden="true"
    />
  );
};

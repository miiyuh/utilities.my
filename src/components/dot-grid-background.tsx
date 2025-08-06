"use client";

import { useEffect } from 'react';

export function DotGridBackground() {
  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let animationId: number;
    let mouseX = 0;
    let mouseY = 0;
    let isMouseMoving = false;
    let lastMouseMove = 0;

    const init = () => {
      // Create canvas element
      canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '-1';
      canvas.style.opacity = '1.0';
      
      ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Append to body
      document.body.appendChild(canvas);

      // Set canvas size
      resize();
      
      // Start animation
      animate();
    };

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseMoving = true;
      lastMouseMove = Date.now();
    };

    const drawDot = (x: number, y: number, opacity: number, size: number = 2) => {
      if (!ctx) return;
      
      ctx.fillStyle = `hsla(240, 6%, 50%, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    const animate = () => {
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fade out mouse movement
      if (Date.now() - lastMouseMove > 100) {
        isMouseMoving = false;
      }

      const dotSize = 30;
      const baseOpacity = 0.4;
      const hoverOpacity = 1.0;
      const influenceRadius = 120;

      // Draw dots
      for (let x = 0; x < canvas.width; x += dotSize) {
        for (let y = 0; y < canvas.height; y += dotSize) {
          let opacity = baseOpacity;
          let size = 2;

          if (isMouseMoving) {
            const dx = x - mouseX;
            const dy = y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < influenceRadius) {
              const influence = 1 - (distance / influenceRadius);
              const easedInfluence = influence * influence; // Quadratic easing
              opacity = baseOpacity + (hoverOpacity - baseOpacity) * easedInfluence;
              size = 2 + easedInfluence * 3;
            }
          }

          drawDot(x, y, opacity, size);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    // Initialize
    init();

    // Event listeners
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      if (canvas) {
        document.body.removeChild(canvas);
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return null;
}

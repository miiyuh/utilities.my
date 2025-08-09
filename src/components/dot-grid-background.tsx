'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/theme-provider'

interface DotGridBackgroundProps {
  dotSize?: number;
  spacing?: number;
  baseOpacity?: number;
  hoverOpacity?: number;
  hoverRadius?: number;
  color?: string; // Optional override; if absent we derive from theme for contrast
}

// Adapted from user-provided implementation (renamed to maintain existing export)
export function DotGridBackground({
  dotSize = 2,
  spacing = 40,
  baseOpacity = 0.1,
  hoverOpacity = 0.8,
  hoverRadius = 80,
  color
}: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(1,0,0,1,0,0)
      ctx.scale(dpr, dpr)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = e.clientX
      mousePosRef.current.y = e.clientY
    }

    const handleMouseLeave = () => {
      mousePosRef.current.x = -1000
      mousePosRef.current.y = -1000
    }

    // We'll recompute theme-driven styling inside draw loop using latest refs
    let effectiveBaseOpacity = baseOpacity
    let effectiveHoverOpacity = hoverOpacity
    let resolvedColour = color || ''

    const resolveThemeColour = () => {
      if (color) return color
      const root = document.documentElement
      const styles = getComputedStyle(root)
      const fgRaw = styles.getPropertyValue('--foreground').trim() // e.g. "240 6% 5%"
      const bgRaw = styles.getPropertyValue('--background').trim()
      const fg = fgRaw ? `hsl(${fgRaw})` : '#0d0d0f'
      const bg = bgRaw ? `hsl(${bgRaw})` : '#ffffff'
      // For dark mode we want a lighter mid-tone than pure foreground (which is already light cream)
      if (theme === 'dark') {
        // foreground is cream already; mix slightly with bg to soften
        return fg
      }
      // Light theme: use a darker tone (foreground) directly
      return fg
    }

    const drawDots = () => {
      // Update theme adaptive values each frame (cheap) so effect doesn't depend on theme
      if (!color) {
        resolvedColour = resolveThemeColour()
        if (theme === 'dark') {
          effectiveBaseOpacity = 0.34
          effectiveHoverOpacity = 0.72
        } else {
          effectiveBaseOpacity = 0.18
          effectiveHoverOpacity = 0.38
        }
      } else {
        resolvedColour = color
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          const dx = x - mousePosRef.current.x
          const dy = y - mousePosRef.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)

            let opacity = effectiveBaseOpacity;
            if (distance < hoverRadius) {
              const factor = 1 - (distance / hoverRadius);
              opacity = effectiveBaseOpacity + (effectiveHoverOpacity - effectiveBaseOpacity) * factor;
            }

          ctx.fillStyle = resolvedColour;
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

  animationRef.current = requestAnimationFrame(drawDots);
    };

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    
    drawDots()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  // Effect only re-runs when structural props or theme override inputs change (not mouse)
  }, [dotSize, spacing, baseOpacity, hoverOpacity, hoverRadius, color, theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ background: 'transparent' }}
    />
  )
}

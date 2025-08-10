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
  spacing: spacingProp = 40,
  baseOpacity = 0.1,
  hoverOpacity = 0.8,
  hoverRadius = 80,
  color
}: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosRef = useRef({ x: -1000, y: -1000 }) // target position
  const easedPosRef = useRef({ x: -1000, y: -1000 }) // animated position
  const rafRef = useRef<number | null>(null)
  const needsRedrawRef = useRef<boolean>(true)
  const positionsRef = useRef<Array<{x:number;y:number}>>([])
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dynamically adapt spacing if not explicitly provided (keep ~70 columns target on very wide displays)
    const computeSpacing = () => {
      if (spacingProp) return spacingProp
      const targetCols = 70
      const s = Math.max(24, Math.min(64, Math.floor(window.innerWidth / targetCols)))
      return s
    }

    let spacing = computeSpacing()

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(1,0,0,1,0,0)
      ctx.scale(dpr, dpr)
      // Offscreen setup
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement('canvas')
      }
      const o = offscreenRef.current
      o.width = w * dpr
      o.height = h * dpr
      offscreenCtxRef.current = o.getContext('2d')
      if (offscreenCtxRef.current) {
        offscreenCtxRef.current.setTransform(1,0,0,1,0,0)
        offscreenCtxRef.current.scale(dpr, dpr)
      }
      spacing = computeSpacing()
      precomputePositions()
      prerenderBase()
      scheduleDraw()
    }

    const precomputePositions = () => {
      const cols = Math.ceil(window.innerWidth / spacing) + 1
      const rows = Math.ceil(window.innerHeight / spacing) + 1
      const arr: Array<{x:number;y:number}> = []
      for (let i=0;i<cols;i++) {
        const x = i * spacing
        for (let j=0;j<rows;j++) {
          arr.push({x, y: j * spacing})
        }
      }
      positionsRef.current = arr
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = e.clientX
      mousePosRef.current.y = e.clientY
      // Kick animation if not running
      scheduleDraw(true)
    }
    const handleMouseLeave = () => {
      mousePosRef.current.x = -1000
      mousePosRef.current.y = -1000
      scheduleDraw(true)
    }

    let resolvedColour = color || ''
    let effectiveBaseOpacity = baseOpacity
    let effectiveHoverOpacity = hoverOpacity

    const resolveThemeColour = () => {
      if (color) return color
      const styles = getComputedStyle(document.documentElement)
      const fgRaw = styles.getPropertyValue('--foreground').trim()
      const fg = fgRaw ? `hsl(${fgRaw})` : '#0d0d0f'
      return fg
    }

  const scheduleDraw = (animate = false) => {
      needsRedrawRef.current = true
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => draw(animate))
      }
    }

    const prerenderBase = () => {
      const octx = offscreenCtxRef.current
      if (!octx) return
      // Resolve theme coloration just for base (use base effective opacity only)
      let resolvedColour = color || ''
      if (!color) {
        resolvedColour = resolveThemeColour()
      }
      octx.clearRect(0,0,offscreenRef.current!.width,offscreenRef.current!.height)
      octx.fillStyle = resolvedColour
      octx.globalAlpha = 1
      // Base alpha drawn individually so final alpha equals baseOpacity
      for (const p of positionsRef.current) {
        octx.globalAlpha = baseOpacity
        octx.beginPath()
        octx.arc(p.x, p.y, dotSize / 2, 0, Math.PI * 2)
        octx.fill()
      }
    }

    const draw = (animate: boolean) => {
      if (!needsRedrawRef.current) { rafRef.current = null; return }
      needsRedrawRef.current = false
      rafRef.current = null

      if (!color) {
        resolvedColour = resolveThemeColour()
        if (theme === 'dark') {
          effectiveBaseOpacity = 0.28
          effectiveHoverOpacity = 0.62
        } else {
          effectiveBaseOpacity = 0.16
          effectiveHoverOpacity = 0.34
        }
      } else {
        resolvedColour = color
      }

      // Draw pre-rendered base grid first
      if (offscreenRef.current) {
        ctx.clearRect(0,0,canvas.width,canvas.height)
        ctx.globalAlpha = 1
        ctx.drawImage(offscreenRef.current,0,0)
      }

      const hoverR2 = hoverRadius * hoverRadius
      // Easing towards target for a smoother feel on large screens
      if (animate) {
        const ease = 0.18
        easedPosRef.current.x += (mousePosRef.current.x - easedPosRef.current.x) * ease
        easedPosRef.current.y += (mousePosRef.current.y - easedPosRef.current.y) * ease
      } else {
        easedPosRef.current.x = mousePosRef.current.x
        easedPosRef.current.y = mousePosRef.current.y
      }
      const mx = easedPosRef.current.x
      const my = easedPosRef.current.y

      // Highlight overlay: only iterate positions within bounding square for efficiency
      if (mx > -500 && offscreenCtxRef.current) {
        ctx.fillStyle = resolvedColour
        const minX = mx - hoverRadius
        const maxX = mx + hoverRadius
        const minY = my - hoverRadius
        const maxY = my + hoverRadius
        for (const p of positionsRef.current) {
          if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue
          const dx = p.x - mx
          const dy = p.y - my
            const dist2 = dx*dx + dy*dy
            if (dist2 < hoverR2) {
              const factor = 1 - Math.sqrt(dist2) / hoverRadius
              const extra = (effectiveHoverOpacity - baseOpacity) * factor
              if (extra > 0.005) {
                ctx.globalAlpha = Math.min(1, baseOpacity + extra)
                ctx.beginPath()
                ctx.arc(p.x, p.y, dotSize / 2, 0, Math.PI * 2)
                ctx.fill()
              }
            }
        }
      }
      // Continue animating while easing distance significant
      if (animate) {
        const tx = mousePosRef.current.x
        const ty = mousePosRef.current.y
        const dx = tx - easedPosRef.current.x
        const dy = ty - easedPosRef.current.y
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          scheduleDraw(true)
        }
      }
    }

  resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [spacingProp, dotSize, baseOpacity, hoverOpacity, hoverRadius, color, theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      style={{ background: 'transparent' }}
      aria-hidden="true"
    />
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

export function InteractiveGridBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let mouseX = -1000
        let mouseY = -1000

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }

        const handleMouseLeave = () => {
            mouseX = -1000
            mouseY = -1000
        }

        // Grid configuration
        const gridSize = 40
        const influenceRadius = 150

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Determine color based on theme
            const isDark = resolvedTheme === 'dark'
            
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
            ctx.lineWidth = 1

            const cols = Math.ceil(canvas.width / gridSize)
            const rows = Math.ceil(canvas.height / gridSize)

            // Draw vertical lines
            for (let i = 0; i <= cols; i++) {
                ctx.beginPath()
                for (let j = 0; j <= rows; j++) {
                    const x = i * gridSize
                    const y = j * gridSize

                    // Calculate distance from mouse
                    const dx = mouseX - x
                    const dy = mouseY - y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    let drawX = x
                    let drawY = y

                    if (distance < influenceRadius) {
                        const force = (influenceRadius - distance) / influenceRadius
                        const angle = Math.atan2(dy, dx)
                        const pushFactor = 20 * force

                        drawX -= Math.cos(angle) * pushFactor
                        drawY -= Math.sin(angle) * pushFactor
                    }

                    if (j === 0) {
                        ctx.moveTo(drawX, drawY)
                    } else {
                        ctx.lineTo(drawX, drawY)
                    }
                }
                ctx.stroke()
            }

            // Draw horizontal lines
            for (let j = 0; j <= rows; j++) {
                ctx.beginPath()
                for (let i = 0; i <= cols; i++) {
                    const x = i * gridSize
                    const y = j * gridSize

                    // Calculate distance from mouse
                    const dx = mouseX - x
                    const dy = mouseY - y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    let drawX = x
                    let drawY = y

                    if (distance < influenceRadius) {
                        const force = (influenceRadius - distance) / influenceRadius
                        const angle = Math.atan2(dy, dx)
                        const pushFactor = 20 * force

                        drawX -= Math.cos(angle) * pushFactor
                        drawY -= Math.sin(angle) * pushFactor
                    }

                    if (i === 0) {
                        ctx.moveTo(drawX, drawY)
                    } else {
                        ctx.lineTo(drawX, drawY)
                    }
                }
                ctx.stroke()
            }

            animationFrameId = requestAnimationFrame(draw)
        }

        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)

        resize()
        draw()

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
            cancelAnimationFrame(animationFrameId)
        }
    }, [resolvedTheme])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ opacity: 0.6 }}
        />
    )
}

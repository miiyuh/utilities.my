"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpinWheelCanvasProps {
  items: string[];
  onSpin: (winner: string) => void;
  disabled?: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3',
  '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#10AC84', '#EE5A6F',
  '#C44569', '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055'
];

export function SpinWheelCanvas({ items, onSpin, disabled = false }: SpinWheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string>('');

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (items.length === 0) {
      // Draw empty wheel
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add items to spin', centerX, centerY);
      return;
    }

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const anglePerSlice = (2 * Math.PI) / items.length;

    // Draw slices
    for (let i = 0; i < items.length; i++) {
      const startAngle = i * anglePerSlice;
      const endAngle = (i + 1) * anglePerSlice;
      const color = COLORS[i % COLORS.length];

      // Draw slice
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Draw slice border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      const textAngle = startAngle + anglePerSlice / 2;
      const textRadius = radius * 0.7;
      const textX = Math.cos(textAngle) * textRadius;
      const textY = Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(12, Math.min(16, radius / 8))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Truncate long text
      let text = items[i];
      if (text.length > 12) {
        text = text.substring(0, 10) + '...';
      }
      
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    // Draw pointer
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.moveTo(centerX + radius - 20, centerY);
    ctx.lineTo(centerX + radius + 10, centerY - 15);
    ctx.lineTo(centerX + radius + 10, centerY + 15);
    ctx.closePath();
    ctx.fill();

    // Draw pointer border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [items, rotation]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x, y },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']
    });
  };  const handleSpin = () => {
    if (disabled || isSpinning || items.length < 2) return;

    setIsSpinning(true);
    
    // Generate random spin amount
    const spins = 5 + Math.random() * 5; // 5-10 full spins
    const randomAngle = Math.random() * 360; // Random final angle
    const finalRotation = spins * 360 + randomAngle;

    // Animate the spin
    let startTime: number | null = null;
    const duration = 3000 + Math.random() * 2000; // 3-5 seconds

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = rotation + finalRotation * easeOut;
      
      setRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);      } else {
        // Spin complete - calculate which slice the pointer lands on
        const finalAngle = (rotation + finalRotation) % 360;
        const anglePerSlice = 360 / items.length;
        
        // The pointer is at 0° (pointing right)
        // We need to find which slice is currently at 0° after rotation
        // Since the wheel rotated, we need to reverse the rotation to find the original slice
        const normalizedAngle = (360 - finalAngle) % 360;
        let winnerIndex = Math.floor(normalizedAngle / anglePerSlice);
        
        // Ensure we stay within bounds
        winnerIndex = winnerIndex % items.length;
        
        const selectedWinner = items[winnerIndex];
        setWinner(selectedWinner);
        
        setIsSpinning(false);
        setTimeout(() => {
          triggerConfetti();
          onSpin(selectedWinner);
        }, 200);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="border-2 border-border rounded-full shadow-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {isSpinning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
              Spinning...
            </div>
          </div>
        )}
      </div>
      
      <Button
        onClick={handleSpin}
        disabled={disabled || isSpinning || items.length < 2}
        size="lg"
        className="min-w-[120px]"
      >
        {isSpinning ? (
          <>
            <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
            Spinning...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Spin Wheel
          </>
        )}
      </Button>
      
      {winner && !isSpinning && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Last winner:</p>
          <p className="font-semibold text-lg">{winner}</p>
        </div>
      )}
    </div>
  );
}

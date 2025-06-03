"use client";

import { useEffect, useRef } from "react";

export default function MusicVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match its display size
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    resizeCanvas();

    // Animation variables
    let animationId: number;
    const bars = 64;
    const barWidth = canvas.width / bars;
    const maxBarHeight = canvas.height / 2;

    // Generate random bar heights for visualization
    const generateBars = () => {
      return Array.from({ length: bars }, () => Math.random() * maxBarHeight);
    };

    let barHeights = generateBars();
    const targetHeights = generateBars();

    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update bar heights with smooth transitions
      barHeights = barHeights.map((height, i) => {
        return height + (targetHeights[i] - height) * 0.1;
      });

      // Occasionally update target heights for some bars
      if (Math.random() > 0.9) {
        const index = Math.floor(Math.random() * bars);
        targetHeights[index] = Math.random() * maxBarHeight;
      }

      // Draw bars
      ctx.fillStyle = "rgba(52, 211, 153, 0.5)"; // emerald-500 with transparency

      // Mirror bars on top and bottom
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;
        const height = barHeights[i];

        // Top bar
        ctx.fillRect(x, canvas.height / 2 - height, barWidth - 1, height);

        // Bottom bar (mirrored)
        ctx.fillRect(x, canvas.height / 2, barWidth - 1, height);
      }

      // Continue animation
      animationId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full opacity-60" style={{ mixBlendMode: "screen" }} />;
}

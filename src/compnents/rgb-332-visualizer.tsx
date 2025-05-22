import React, { useEffect, useRef } from 'react';

const RGB332Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / 2;
    const height = canvas.height;

    const imageDataFull = ctx.createImageData(width, height);
    const imageData332 = ctx.createImageData(width, height);

    let i = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const r = Math.floor((x / width) * 255);
        const g = Math.floor((y / height) * 255);
        const b = Math.floor(255 - ((x + y) / (width + height)) * 255);

        // Full RGB image
        imageDataFull.data[i] = r;
        imageDataFull.data[i + 1] = g;
        imageDataFull.data[i + 2] = b;
        imageDataFull.data[i + 3] = 255;

        // RGB332 quantization
        const r3 = (r >> 5) & 0x07;
        const g3 = (g >> 5) & 0x07;
        const b2 = (b >> 6) & 0x03;

        const rOut = (r3 * 255) / 7;
        const gOut = (g3 * 255) / 7;
        const bOut = (b2 * 255) / 3;

        imageData332.data[i] = rOut;
        imageData332.data[i + 1] = gOut;
        imageData332.data[i + 2] = bOut;
        imageData332.data[i + 3] = 255;

        i += 4;
      }
    }

    ctx.putImageData(imageDataFull, 0, 0); // Left: full RGB
    ctx.putImageData(imageData332, width, 0); // Right: RGB332
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>RGB vs RGB332 Color Comparison</h3>
      <canvas
        ref={canvasRef}
        width={512}
        height={256}
        style={{ border: '1px solid black', imageRendering: 'pixelated' }}
      />
      <p>Left: Full RGB | Right: RGB332 (1 byte color)</p>
    </div>
  );
};

export default RGB332Visualizer;
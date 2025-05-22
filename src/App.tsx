import React, { useEffect, useRef, useState } from 'react';

import './App.css';
const PIXEL_SIZE = 10;

type Renderer = {
  reset(): void;
  renderFrame(width: number, height: number): Uint8ClampedArray;
};

function createSweepRenderer(): Renderer {
  let offset = 0;

  const hslToRgb = (
    h: number,
    s: number,
    l: number
  ): [number, number, number] => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  return {
    reset() {
      offset = 0;
    },
    renderFrame(width, height) {
      const data = new Uint8ClampedArray(width * height * 4);
      let i = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const hue = ((x + offset) % width) * (360 / width);
          const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
          data[i++] = r;
          data[i++] = g;
          data[i++] = b;
          data[i++] = 255;
        }
      }
      offset = (offset + 1) % width;
      return data;
    },
  };
}

function createMatrixRenderer(speed = 1, fallChance = 0.7): Renderer {
  let columns: number[] = [];

  return {
    reset() {
      columns = [];
    },
    renderFrame(width, height) {
      if (columns.length !== width) {
        columns = Array(width)
          .fill(0)
          .map(() => Math.floor(Math.random() * height));
      }

      const data = new Uint8ClampedArray(width * height * 4);
      let i = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const colY = columns[x];
          let r = 0,
            g = 0,
            b = 0;
          if (y === colY) {
            g = 255;
            b = 255;
          } else if (y < colY && y > colY - 5) {
            g = 100 + Math.floor(30 * (5 - (colY - y)));
            b = 255;
          }
          data[i++] = r;
          data[i++] = g;
          data[i++] = b;
          data[i++] = 255;
        }
      }

      columns = columns.map((y) =>
        y > height + 5 ? 0 : y + (Math.random() < fallChance ? speed : 0)
      );
      return data;
    },
  };
}

const rgbToRgb332 = (r: number, g: number, b: number): number => {
  return ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6);
};

function createVideoRenderer(src: string): Renderer {
  const video = document.createElement('video');
  video.src = src;
  video.crossOrigin = 'anonymous'; // Required for getImageData
  video.muted = true;
  video.loop = true;
  video.play();

  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');

  return {
    reset() {
      video.currentTime = 0;
    },
    renderFrame(width: number, height: number) {
      offscreen.width = width;
      offscreen.height = height;

      if (!ctx || video.readyState < 2) {
        // If video isn't ready, return transparent frame
        return new Uint8ClampedArray(width * height * 4);
      }

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      return imageData.data;
    },
  };
}
export default function App() {
  const [gridWidth, setGridWidth] = useState(40);
  const [gridHeight, setGridHeight] = useState(20);
  const [fps, setFps] = useState(10);
  const [format, setFormat] = useState<'base64' | 'rgb332'>('base64');
  const [mode, setMode] = useState<'sweep' | 'matrix'>('sweep');
  const [stripAlpha, setStripAlpha] = useState(true);
  const [fallChance, setFallChance] = useState(0.7);
  const [bandwidth, setBandwidth] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [lastSentSample, setLastSentSample] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sentBytesRef = useRef(0);
  const lastSampleTimeRef = useRef(0);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;
    socket.onopen = () => console.log('WebSocket connected');
    socket.onclose = () => console.log('WebSocket disconnected');
    socket.onerror = (e) => console.error('WebSocket error', e);
    return () => socket.close();
  }, []);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderers: Record<string, Renderer> = {
      sweep: createSweepRenderer(),
      matrix: createMatrixRenderer(1, fallChance),
      video: createVideoRenderer(
        'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      ),
    };
    const renderer = renderers[mode];

    renderer.reset();

    let lastFrameTime = 0;
    let frameId: number;

    const draw = (timestamp: number) => {
      const interval = 1000 / fps;
      if (timestamp - lastFrameTime < interval) {
        frameId = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      const rgbaData = renderer.renderFrame(gridWidth, gridHeight);
      const imageData = new ImageData(rgbaData, gridWidth, gridHeight);
      ctx.putImageData(imageData, 0, 0);

      let dataString: string;
      if (format === 'base64') {
        let rgbOnly: number[] = [];
        if (stripAlpha) {
          for (let i = 0; i < rgbaData.length; i += 4) {
            rgbOnly.push(rgbaData[i], rgbaData[i + 1], rgbaData[i + 2]);
          }
        } else {
          rgbOnly = Array.from(rgbaData);
        }
        dataString = btoa(String.fromCharCode(...rgbOnly));
      } else {
        const rgb332 = [];
        for (let i = 0; i < rgbaData.length; i += 4) {
          rgb332.push(
            rgbToRgb332(rgbaData[i], rgbaData[i + 1], rgbaData[i + 2])
          );
        }
        dataString = String.fromCharCode(...rgb332);
      }
      sentBytesRef.current += dataString.length;
      const now = performance.now();
      if (now - lastSampleTimeRef.current > 250) {
        setLastSentSample(dataString.slice(0, 100));
        lastSampleTimeRef.current = now;
      }
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(dataString);
      }

      const previewCtx = canvasRef.current?.getContext('2d');
      if (previewCtx) {
        previewCtx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        previewCtx.imageSmoothingEnabled = false;
        previewCtx.drawImage(
          canvas,
          0,
          0,
          gridWidth * PIXEL_SIZE,
          gridHeight * PIXEL_SIZE
        );
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [gridWidth, gridHeight, fps, format, mode, stripAlpha, fallChance]);

  useEffect(() => {
    const interval = setInterval(() => {
      const kb = sentBytesRef.current / 1024;
      setBandwidth(Number(kb.toFixed(1)));
      sentBytesRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={'container'}>
      <div className="form-container">
        <div className="row">
          <label>
            Mode:
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'sweep' | 'matrix')}
            >
              <option value="sweep">Color Sweep</option>
              <option value="matrix">Matrix Rain</option>
              <option value="video">Video</option>
            </select>
          </label>
        </div>
        <div className={'row'}>
          <label>
            Width:
            <input
              type="text"
              value={gridWidth}
              onChange={(e) =>
                setGridWidth(parseInt(e.target.value || '1', 10))
              }
              style={{ margin: '0 10px' }}
            />
          </label>
          <label>
            Height:
            <input
              type="text"
              value={gridHeight}
              onChange={(e) =>
                setGridHeight(parseInt(e.target.value || '1', 10))
              }
              style={{ margin: '0 10px' }}
            />
          </label>
        </div>

        <div className={'row'}>
          <label>
            FPS:
            <input
              type="text"
              value={fps}
              onChange={(e) =>
                setFps(Math.max(1, parseInt(e.target.value || '1', 10)))
              }
              style={{ margin: '0 10px' }}
            />
          </label>
          <label>
            Format:
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'base64' | 'rgb332')}
            >
              <option value="base64">Base64 (RGB)</option>
              <option value="rgb332">RGB332</option>
            </select>
          </label>
        </div>
        <div className={'row'}>
          {format === 'base64' && (
            <label>
              Strip Alpha:
              <input
                type="checkbox"
                checked={stripAlpha}
                onChange={(e) => setStripAlpha(e.target.checked)}
                style={{ marginLeft: 8 }}
              />
            </label>
          )}
        </div>
        <div className="row">
          {mode === 'matrix' && (
            <div style={{ marginTop: 10 }}>
              <label>
                Matrix Fall Chance: {fallChance.toFixed(2)}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={fallChance}
                  onChange={(e) => setFallChance(parseFloat(e.target.value))}
                  style={{ marginLeft: 8 }}
                />
              </label>
            </div>
          )}
        </div>
        <div className={'row'}>
          <label>
            Show Preview:
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              style={{ marginLeft: 8 }}
            />
          </label>
        </div>
      </div>
      <div className="preview-container">
        {showPreview && (
          <canvas
            ref={canvasRef}
            width={gridWidth * PIXEL_SIZE}
            height={gridHeight * PIXEL_SIZE}
            style={{ border: '1px solid black' }}
          />
        )}

        <p style={{ fontSize: 14, marginTop: 10 }}>
          Bandwidth: {bandwidth} KB/s @ {fps} FPS ({format.toUpperCase()},{' '}
          {mode})
        </p>
        <p style={{ fontSize: 12 }}>
          Sent Sample:{' '}
          <code style={{ wordBreak: 'break-all' }}>{lastSentSample}</code>
        </p>
      </div>
    </div>
  );
}

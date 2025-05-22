import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import { renderDecodedPreview } from './utils/preview-decoder';
import { getRenderer } from './renderers/renderer-factory';
import { encodeFrame } from './utils/encode-frame';
import FormControls from './compnents/form-controls';
const PIXEL_SIZE = 10;

export default function App() {
  const [gridWidth, setGridWidth] = useState(40);
  const [gridHeight, setGridHeight] = useState(20);
  const [fps, setFps] = useState(10);
  const [format, setFormat] = useState<'base64' | 'rgb332'>('base64');
  const [mode, setMode] = useState<RendererOptions>('sweep');
  const [stripAlpha, setStripAlpha] = useState(true);
  const [fallChance, setFallChance] = useState(0.7);
  const [bandwidth, setBandwidth] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [lastSentSample, setLastSentSample] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const sentBytesRef = useRef(0);
  const lastSampleTimeRef = useRef(0);


  function maybeSendToSocket(data: string) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);

    }
    sentBytesRef.current += data.length;
  }

  function maybeUpdateSample(data: string) {
    const now = performance.now();
    if (now - lastSampleTimeRef.current > 100) {
      setLastSentSample(data);
      lastSampleTimeRef.current = now;
    }
  }



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

    const renderer = getRenderer(mode, fallChance);
    renderer.reset();

    let frameId = 0;
    let lastTime = 0;

    const draw = (timestamp: number) => {
      const interval = 1000 / fps;
      if (timestamp - lastTime < interval) {
        frameId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      const rgba = renderer.renderFrame(gridWidth, gridHeight);
      ctx.putImageData(new ImageData(rgba, gridWidth, gridHeight), 0, 0);

      const dataString = encodeFrame(rgba, format, stripAlpha, gridWidth, gridHeight);
      maybeSendToSocket(dataString);
      maybeUpdateSample(dataString);
      if (canvasRef.current && dataString) {
        const previewCtx = canvasRef.current.getContext("2d");
        if (previewCtx) { renderDecodedPreview({ ctx: previewCtx, format, dataString, height: gridHeight, width: gridWidth, pixelSize: PIXEL_SIZE }) }


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
      <FormControls
        mode={mode}
        setMode={setMode}
        gridWidth={gridWidth}
        setGridWidth={setGridWidth}
        gridHeight={gridHeight}
        setGridHeight={setGridHeight}
        fps={fps}
        setFps={setFps}
        format={format}
        setFormat={setFormat}
        stripAlpha={stripAlpha}
        setStripAlpha={setStripAlpha}
        fallChance={fallChance}
        setFallChance={setFallChance}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
      />

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
        <p style={{ fontSize: 12, height: "400px" }}>

          <code style={{ wordBreak: 'break-all' }}>{lastSentSample}</code>
        </p>
      </div>
     
    </div>
  );
}

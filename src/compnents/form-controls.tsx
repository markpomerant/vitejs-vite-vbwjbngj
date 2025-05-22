import React from 'react';

type Props = {
  mode: string;
  setMode: (m: RendererOptions) => void;
  gridWidth: number;
  setGridWidth: (w: number) => void;
  gridHeight: number;
  setGridHeight: (h: number) => void;
  fps: number;
  setFps: (fps: number) => void;
  format: 'base64' | 'rgb332';
  setFormat: (f: 'base64' | 'rgb332') => void;
  stripAlpha: boolean;
  setStripAlpha: (s: boolean) => void;
  fallChance: number;
  setFallChance: (c: number) => void;
  showPreview: boolean;
  setShowPreview: (p: boolean) => void;
};

const FormControls: React.FC<Props> = ({
  mode,
  setMode,
  gridWidth,
  setGridWidth,
  gridHeight,
  setGridHeight,
  fps,
  setFps,
  format,
  setFormat,
  stripAlpha,
  setStripAlpha,
  fallChance,
  setFallChance,
  showPreview,
  setShowPreview,
}) => {
  return (
    <div className="form-container">
      <div className="row">
        <label>
          Mode:
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RendererOptions)}
          >
            <option value="sweep">Color Sweep</option>
            <option value="matrix">Matrix Rain</option>
            <option value="video">Video</option>
          </select>
        </label>
      </div>

      <div className="row">
        <label>
          Width:
          <input
            type="text"
            value={gridWidth}
            onChange={(e) => setGridWidth(parseInt(e.target.value || '1', 10))}
            style={{ margin: '0 10px' }}
          />
        </label>
        <label>
          Height:
          <input
            type="text"
            value={gridHeight}
            onChange={(e) => setGridHeight(parseInt(e.target.value || '1', 10))}
            style={{ margin: '0 10px' }}
          />
        </label>
      </div>

      <div className="row">
        <label>
          FPS:
          <input
            type="text"
            value={fps}
            onChange={(e) => setFps(Math.max(1, parseInt(e.target.value || '1', 10)))}
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

      {format === 'base64' && (
        <div className="row">
          <label>
            Strip Alpha:
            <input
              type="checkbox"
              checked={stripAlpha}
              onChange={(e) => setStripAlpha(e.target.checked)}
              style={{ marginLeft: 8 }}
            />
          </label>
        </div>
      )}

      {mode === 'matrix' && (
        <div className="row" style={{ marginTop: 10 }}>
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

      <div className="row">
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
  );
};

export default FormControls;
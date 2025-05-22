export function createSweepRenderer(): Renderer {
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
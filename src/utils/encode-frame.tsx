const rgbToRgb332 = (r: number, g: number, b: number): number => {
    return ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6)};


export function encodeFrame(
    rgba: Uint8ClampedArray,
    format: 'base64' | 'rgb332',
    stripAlpha: boolean,
    width: number,
    height: number
  ): string {
    if (format === 'base64') {
      const rgb = stripAlpha
        ? rgba.filter((_, i) => i % 4 !== 3)
        : Array.from(rgba);
      return btoa(String.fromCharCode(...rgb));
    } else {
      const rgb332 = [];
      for (let i = 0; i < rgba.length; i += 4) {
        rgb332.push(rgbToRgb332(rgba[i], rgba[i + 1], rgba[i + 2]));
      }
      return String.fromCharCode(...rgb332);
    }
  }
  
  
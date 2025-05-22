export const decodeBase64RGB = (base64: string, width: number, height: number): Uint8ClampedArray => {
    const binary = atob(base64);
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < binary.length && j < rgba.length; i += 3, j += 4) {
      rgba[j] = binary.charCodeAt(i);
      rgba[j + 1] = binary.charCodeAt(i + 1);
      rgba[j + 2] = binary.charCodeAt(i + 2);
      rgba[j + 3] = 255;
    }
    return rgba;
  };
  
  export const decodeRGB332 = (data: string, width: number, height: number): Uint8ClampedArray => {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i++) {
      const byte = data.charCodeAt(i);
      const r = ((byte >> 5) & 0x07) * 255 / 7;
      const g = ((byte >> 2) & 0x07) * 255 / 7;
      const b = (byte & 0x03) * 255 / 3;
      const j = i * 4;
      rgba[j] = r;
      rgba[j + 1] = g;
      rgba[j + 2] = b;
      rgba[j + 3] = 255;
    }
    return rgba;
  };

export function renderDecodedPreview({
    ctx,
    format,
    dataString,
    width,
    height,
    pixelSize
  }: {
    ctx: CanvasRenderingContext2D;
    format: 'base64' | 'rgb332';
    dataString: string;
    width: number;
    height: number;
    pixelSize: number;
  }) {
    const decode = format === 'base64'
      ? decodeBase64RGB(dataString, width, height)
      : decodeRGB332(dataString, width, height);
  
    const img = new ImageData(decode, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx?.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width * pixelSize, height * pixelSize);
    ctx.drawImage(tempCanvas, 0, 0, width * pixelSize, height * pixelSize);
  }
declare type Renderer = {
    reset(): void;
    renderFrame(width: number, height: number): Uint8ClampedArray;
  };


  declare type RendererOptions = 'sweep' | 'matrix' | 'video';
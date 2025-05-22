import { createMatrixRenderer } from "./matrix-renderer";
import { createSweepRenderer } from "./sweep-renderer";
import { createVideoRenderer } from "./video-renderer";

export const getRenderer = (mode: string, fallChance = 0.7): Renderer => {
    switch (mode) {
      case 'sweep': return createSweepRenderer();
      case 'matrix': return createMatrixRenderer(1, fallChance);
      case 'video': return createVideoRenderer('../video.mp4');
      default: throw new Error(`Unknown mode: ${mode}`);
    }
  };
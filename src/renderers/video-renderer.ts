export function createVideoRenderer(src: string): Renderer {
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
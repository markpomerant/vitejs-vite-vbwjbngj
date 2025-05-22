export function createMatrixRenderer(speed = 1, fallChance = 0.7): Renderer {
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
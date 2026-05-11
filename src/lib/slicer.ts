export interface SliceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

export async function sliceImage(
  image: HTMLImageElement,
  vLines: number[], // sorted x-coordinates (0 to width)
  hLines: number[]  // sorted y-coordinates (0 to height)
): Promise<{ blob: Blob; filename: string }[]> {
  const slices: { blob: Blob; filename: string }[] = [];
  
  // Ensure lines include boundaries
  const xPoints = [0, ...vLines.sort((a, b) => a - b), image.width];
  const yPoints = [0, ...hLines.sort((a, b) => a - b), image.height];
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Could not create canvas context");

  let count = 1;
  for (let i = 0; i < yPoints.length - 1; i++) {
    for (let j = 0; j < xPoints.length - 1; j++) {
      const x = xPoints[j];
      const y = yPoints[i];
      const width = xPoints[j + 1] - x;
      const height = yPoints[i + 1] - y;

      // Skip invalid dimensions
      if (width <= 0 || height <= 0) continue;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );

      if (blob) {
        slices.push({
          blob,
          filename: `icon_${count.toString().padStart(3, "0")}.png`,
        });
        count++;
      }
    }
  }

  return slices;
}

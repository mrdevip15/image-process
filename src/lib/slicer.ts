export interface SliceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

export async function sliceImage(
  image: HTMLImageElement,
  vLines: number[], // pixel x-coordinates (0 to naturalWidth)
  hLines: number[]  // pixel y-coordinates (0 to naturalHeight)
): Promise<{ blob: Blob; filename: string }[]> {
  const slices: { blob: Blob; filename: string }[] = [];
  
  // Ensure lines include boundaries and are sorted
  const xPoints = Array.from(new Set([0, ...vLines, image.naturalWidth])).sort((a, b) => a - b);
  const yPoints = Array.from(new Set([0, ...hLines, image.naturalHeight])).sort((a, b) => a - b);
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) throw new Error("Could not create canvas context");

  let count = 1;
  for (let i = 0; i < yPoints.length - 1; i++) {
    for (let j = 0; j < xPoints.length - 1; j++) {
      const x = Math.round(xPoints[j]);
      const y = Math.round(yPoints[i]);
      const width = Math.round(xPoints[j + 1] - x);
      const height = Math.round(yPoints[i + 1] - y);

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

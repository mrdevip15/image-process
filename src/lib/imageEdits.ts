export type ActiveTool = "GRID" | "BACKGROUND" | "HUE" | "EFFECTS";

export interface ImageEdits {
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  grayscale: boolean;
  invert: boolean;
  removeBackground: boolean;
  backgroundTolerance: number;
}

export const defaultImageEdits: ImageEdits = {
  hue: 0,
  saturation: 100,
  brightness: 100,
  contrast: 100,
  grayscale: false,
  invert: false,
  removeBackground: false,
  backgroundTolerance: 34,
};

export function buildImageFilter(edits: ImageEdits) {
  return [
    `hue-rotate(${edits.hue}deg)`,
    `saturate(${edits.saturation}%)`,
    `brightness(${edits.brightness}%)`,
    `contrast(${edits.contrast}%)`,
    edits.grayscale ? "grayscale(100%)" : "",
    edits.invert ? "invert(100%)" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function hasVisualEdits(edits: ImageEdits) {
  return (
    edits.hue !== defaultImageEdits.hue ||
    edits.saturation !== defaultImageEdits.saturation ||
    edits.brightness !== defaultImageEdits.brightness ||
    edits.contrast !== defaultImageEdits.contrast ||
    edits.grayscale !== defaultImageEdits.grayscale ||
    edits.invert !== defaultImageEdits.invert ||
    edits.removeBackground !== defaultImageEdits.removeBackground
  );
}

export function renderEditedCanvas(image: HTMLImageElement, edits: ImageEdits) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: edits.removeBackground });
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = buildImageFilter(edits);
  ctx.drawImage(image, 0, 0);
  ctx.filter = "none";

  if (edits.removeBackground) {
    removeBackgroundFromCanvas(ctx, canvas.width, canvas.height, edits.backgroundTolerance);
  }

  return canvas;
}

export function canvasToImage(canvas: HTMLCanvasElement) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL("image/png");
  });
}

function removeBackgroundFromCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tolerance: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const samples = getCornerSamples(data, width, height);
  const threshold = Math.max(0, Math.min(442, tolerance * 4.42));

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    const nearestDistance = Math.min(
      ...samples.map((sample) => colorDistance(red, green, blue, sample[0], sample[1], sample[2]))
    );

    if (nearestDistance <= threshold) {
      const fade = nearestDistance / threshold;
      data[i + 3] = Math.round(data[i + 3] * fade);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function getCornerSamples(data: Uint8ClampedArray, width: number, height: number) {
  const coordinates = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  return coordinates.map(([x, y]) => {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2]] as const;
  });
}

function colorDistance(
  redA: number,
  greenA: number,
  blueA: number,
  redB: number,
  greenB: number,
  blueB: number
) {
  return Math.hypot(redA - redB, greenA - greenB, blueA - blueB);
}

export type ActiveTool = "GRID" | "BACKGROUND" | "HUE" | "EFFECTS";

export interface ImageEdits {
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  grayscale: boolean;
  invert: boolean;
  removeBackground: boolean;
}

export const defaultImageEdits: ImageEdits = {
  hue: 0,
  saturation: 100,
  brightness: 100,
  contrast: 100,
  grayscale: false,
  invert: false,
  removeBackground: false,
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

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = buildImageFilter(edits);
  ctx.drawImage(image, 0, 0);
  ctx.filter = "none";

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

export function imageSourceToBlob(src: string) {
  return fetch(src).then((response) => response.blob());
}

export function loadImageFromSrc(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

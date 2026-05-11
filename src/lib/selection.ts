export type SelectionMode = "freehand" | "pen" | "smart";

export interface SelectionPoint {
  x: number;
  y: number;
}

export interface ImageSelection {
  mode: SelectionMode;
  points: SelectionPoint[];
  closed: boolean;
  maskDataUrl?: string;
  width?: number;
  height?: number;
}

export const defaultSelectionMode: SelectionMode = "smart";
export const defaultSmartTolerance = 36;

export function pointsToPath(points: SelectionPoint[], zoom: number, closed = true) {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const commands = [`M ${first.x * zoom} ${first.y * zoom}`];
  rest.forEach((point) => commands.push(`L ${point.x * zoom} ${point.y * zoom}`));
  if (closed && points.length > 2) commands.push("Z");
  return commands.join(" ");
}

export function distance(a: SelectionPoint, b: SelectionPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clampPoint(point: SelectionPoint, width: number, height: number): SelectionPoint {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y)),
  };
}

export async function loadImageForCanvas(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawPolygonMask(
  ctx: CanvasRenderingContext2D,
  points: SelectionPoint[],
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
  if (points.length < 3) return;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fill();
}

export async function applySelectionMaskToImage(
  imageSrc: string,
  selection: ImageSelection,
  width: number,
  height: number
) {
  const image = await loadImageForCanvas(imageSrc);
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const ctx = output.getContext("2d");
  if (!ctx) throw new Error("Could not create output canvas context.");

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  ctx.globalCompositeOperation = "destination-in";

  if (selection.maskDataUrl) {
    const mask = await loadImageForCanvas(selection.maskDataUrl);
    ctx.drawImage(mask, 0, 0, width, height);
  } else {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) throw new Error("Could not create mask canvas context.");
    drawPolygonMask(maskCtx, selection.points, width, height);
    ctx.drawImage(maskCanvas, 0, 0);
  }

  ctx.globalCompositeOperation = "source-over";
  return output.toDataURL("image/png");
}

export async function createSmartSelection(
  imageSrc: string,
  seed: SelectionPoint,
  width: number,
  height: number,
  tolerance: number
): Promise<ImageSelection> {
  const image = await loadImageForCanvas(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create selection canvas context.");

  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startX = Math.floor(Math.max(0, Math.min(width - 1, seed.x)));
  const startY = Math.floor(Math.max(0, Math.min(height - 1, seed.y)));
  const startIndex = (startY * width + startX) * 4;
  const target = [data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]];
  const visited = new Uint8Array(width * height);
  const selected = new Uint8Array(width * height);
  const stack = [startY * width + startX];
  const threshold = tolerance * tolerance;
  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;

  while (stack.length) {
    const index = stack.pop()!;
    if (visited[index]) continue;
    visited[index] = 1;
    const offset = index * 4;
    const dr = data[offset] - target[0];
    const dg = data[offset + 1] - target[1];
    const db = data[offset + 2] - target[2];
    const da = (data[offset + 3] - target[3]) * 0.35;
    if (dr * dr + dg * dg + db * db + da * da > threshold) continue;

    selected[index] = 1;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    if (x > 0) stack.push(index - 1);
    if (x < width - 1) stack.push(index + 1);
    if (y > 0) stack.push(index - width);
    if (y < height - 1) stack.push(index + width);
  }

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Could not create smart mask context.");
  const maskData = maskCtx.createImageData(width, height);
  for (let i = 0; i < selected.length; i++) {
    if (!selected[i]) continue;
    const offset = i * 4;
    maskData.data[offset] = 255;
    maskData.data[offset + 1] = 255;
    maskData.data[offset + 2] = 255;
    maskData.data[offset + 3] = 255;
  }
  maskCtx.putImageData(maskData, 0, 0);

  const points = traceMaskOutline(selected, width, height, minX, minY, maxX, maxY);
  return {
    mode: "smart",
    points,
    closed: true,
    maskDataUrl: maskCanvas.toDataURL("image/png"),
    width,
    height,
  };
}

function traceMaskOutline(
  selected: Uint8Array,
  width: number,
  height: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
) {
  const boundary: SelectionPoint[] = [];
  const step = Math.max(2, Math.floor(Math.max(maxX - minX, maxY - minY) / 90));
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      const i = y * width + x;
      if (!selected[i]) continue;
      const touchesOutside =
        x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
        !selected[i - 1] || !selected[i + 1] || !selected[i - width] || !selected[i + width];
      if (touchesOutside) boundary.push({ x, y });
    }
  }

  if (boundary.length < 3) {
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
  }

  const center = boundary.reduce(
    (acc, point) => ({ x: acc.x + point.x / boundary.length, y: acc.y + point.y / boundary.length }),
    { x: 0, y: 0 }
  );
  return boundary
    .sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x))
    .filter((_, index) => index % Math.max(1, Math.floor(boundary.length / 180)) === 0);
}

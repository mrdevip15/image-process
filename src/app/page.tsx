"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Workspace } from "@/components/Workspace";
import { RightPanel } from "@/components/RightPanel";
import { Cropper } from "@/components/Cropper";
import { sliceImage } from "@/lib/slicer";
import {
  ActiveTool,
  ImageEdits,
  buildImageFilter,
  canvasToImage,
  defaultImageEdits,
  hasVisualEdits,
  imageSourceToBlob,
  loadImageFromSrc,
  renderEditedCanvas,
} from "@/lib/imageEdits";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImageSquare, 
  Crop, 
  GridFour, 
  CloudArrowUp,
  Files,
  Eraser,
  Palette,
  SlidersHorizontal,
  DownloadSimple,
  ArrowCounterClockwise,
  ArrowUUpLeft,
  ArrowUUpRight,
} from "@phosphor-icons/react";
import { Crop as CropState, PixelCrop } from "react-image-crop";

type AppMode = "UPLOAD" | "CROP" | "SLICE";

interface EditorSnapshot {
  vLines: number[];
  hLines: number[];
  imageEdits: ImageEdits;
  backgroundRemovedSrc?: string;
}

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function ToolButton({ label, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`group relative p-2 rounded-lg transition-colors ${
        active ? "bg-zinc-800 text-emerald-500" : "text-zinc-600 hover:text-zinc-100 hover:bg-zinc-800/70"
      } ${disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-zinc-600" : ""}`}
    >
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>("UPLOAD");
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [vLines, setVLines] = useState<number[]>([]); // percentages
  const [hLines, setHLines] = useState<number[]>([]); // percentages
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>("GRID");
  const [imageEdits, setImageEdits] = useState<ImageEdits>(defaultImageEdits);
  const [backgroundRemovedSrc, setBackgroundRemovedSrc] = useState<string | undefined>();
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);
  
  // Canvas State (Zoom)
  const [zoom, setZoom] = useState(1);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  // Crop State moved here for sidebar access
  const [crop, setCrop] = useState<CropState>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const calculateFitZoom = useCallback((img: HTMLImageElement) => {
    if (!canvasAreaRef.current) return 1;
    const padding = 64; // Account for p-8 on both sides
    const availableWidth = canvasAreaRef.current.clientWidth - padding;
    const availableHeight = canvasAreaRef.current.clientHeight - padding;
    
    const scaleX = availableWidth / img.naturalWidth;
    const scaleY = availableHeight / img.naturalHeight;
    
    // Choose the smaller scale to ensure it fits both dimensions
    // Cap at 1 (100%) so we don't upscale small images automatically
    return Math.min(scaleX, scaleY, 1);
  }, []);

  const handleZoomFit = useCallback(() => {
    const activeImage = originalImage || image;
    if (activeImage) {
      setZoom(calculateFitZoom(activeImage));
    }
  }, [originalImage, image, calculateFitZoom]);

  const createSnapshot = useCallback((): EditorSnapshot => ({
    vLines: [...vLines],
    hLines: [...hLines],
    imageEdits: { ...imageEdits },
    backgroundRemovedSrc,
  }), [backgroundRemovedSrc, hLines, imageEdits, vLines]);

  const rememberCurrentState = useCallback(() => {
    const snapshot = createSnapshot();
    setUndoStack((current) => [...current.slice(-49), snapshot]);
    setRedoStack([]);
  }, [createSnapshot]);

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    setVLines(snapshot.vLines);
    setHLines(snapshot.hLines);
    setImageEdits(snapshot.imageEdits);
    setBackgroundRemovedSrc(snapshot.backgroundRemovedSrc);
  };

  const handleUndo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setRedoStack((current) => [...current.slice(-49), createSnapshot()]);
    setUndoStack((current) => current.slice(0, -1));
    restoreSnapshot(previous);
  };

  const handleRedo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setUndoStack((current) => [...current.slice(-49), createSnapshot()]);
    setRedoStack((current) => current.slice(0, -1));
    restoreSnapshot(next);
  };

  const handleUpload = (img: HTMLImageElement) => {
    setOriginalImage(img);
    setImage(null);
    setImageEdits(defaultImageEdits);
    setBackgroundRemovedSrc(undefined);
    setUndoStack([]);
    setRedoStack([]);
    setActiveTool("GRID");
    setAppMode("CROP");
    // We need to wait for the next tick or use a timeout to ensure 
    // the layout has settled if canvasAreaRef depends on conditional rendering
    setTimeout(() => {
      setZoom(calculateFitZoom(img));
    }, 50);
  };

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imgRef.current || !originalImage) return;

    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedImg = new Image();
    croppedImg.onload = () => {
      setImage(croppedImg);
      setAppMode("SLICE");
      setActiveTool("GRID");
      setZoom(calculateFitZoom(croppedImg));
      generateGrid(4, 4, false);
    };
    croppedImg.src = canvas.toDataURL("image/png");
  };

  const generateGrid = (rows: number, cols: number, shouldRemember = true) => {
    if (shouldRemember) rememberCurrentState();
    const newVLines = [];
    for (let i = 1; i < cols; i++) {
      newVLines.push((i / cols) * 100);
    }
    const newHLines = [];
    for (let i = 1; i < rows; i++) {
      newHLines.push((i / rows) * 100);
    }
    setVLines(newVLines);
    setHLines(newHLines);
  };

  const handleDownload = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const exportImage = hasVisualEdits(imageEdits)
        ? await canvasToImage(renderEditedCanvas(await getCurrentImageSource(), imageEdits))
        : await getCurrentImageSource();
      const vPixels = vLines.map((p) => (p / 100) * image.naturalWidth);
      const hPixels = hLines.map((p) => (p / 100) * image.naturalHeight);
      const slices = await sliceImage(exportImage, vPixels, hPixels);
      const zip = new JSZip();
      slices.forEach((slice) => zip.file(slice.filename, slice.blob));
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "sliced_icons.zip");
    } catch (error) {
      console.error("Slicing failed:", error);
      alert("Failed to slice image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadEditedImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const canvas = renderEditedCanvas(await getCurrentImageSource(), imageEdits);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (blob) saveAs(blob, "edited_icon_sheet.png");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export edited image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAppMode("UPLOAD");
    setOriginalImage(null);
    setImage(null);
    setVLines([]);
    setHLines([]);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setZoom(1);
    setActiveTool("GRID");
    setImageEdits(defaultImageEdits);
    setBackgroundRemovedSrc(undefined);
    setUndoStack([]);
    setRedoStack([]);
  };

  const updateImageEdits = (nextEdits: Partial<ImageEdits>) => {
    rememberCurrentState();
    setImageEdits((current) => ({ ...current, ...nextEdits }));
  };

  const resetImageEdits = () => {
    rememberCurrentState();
    setImageEdits(defaultImageEdits);
    setBackgroundRemovedSrc(undefined);
  };

  const getCurrentImageSource = async () => {
    if (!image) throw new Error("No image loaded.");
    if (imageEdits.removeBackground && backgroundRemovedSrc) {
      return loadImageFromSrc(backgroundRemovedSrc);
    }
    return image;
  };

  const applyRembgBackgroundRemoval = async () => {
    if (!image) return;
    rememberCurrentState();
    setIsRemovingBackground(true);
    try {
      const formData = new FormData();
      formData.append("image", await imageSourceToBlob(image.src), "input.png");
      formData.append("model", "isnet-general-use");

      const response = await fetch("/api/remove-background", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const details = await response.json().catch(() => undefined);
        throw new Error(details?.error || "Failed to remove background with rembg.");
      }

      const blob = await response.blob();
      setBackgroundRemovedSrc(URL.createObjectURL(blob));
      setImageEdits((current) => ({ ...current, removeBackground: true }));
    } catch (error) {
      setUndoStack((current) => current.slice(0, -1));
      const message = error instanceof Error ? error.message : "Failed to remove background.";
      console.log("rembg background removal failed", {
        message,
        installHint: 'Install rembg locally with: pip install "rembg[cpu,cli]"',
      });
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const updateVLines = (lines: number[]) => {
    rememberCurrentState();
    setVLines(lines);
  };

  const updateHLines = (lines: number[]) => {
    rememberCurrentState();
    setHLines(lines);
  };

  const addVLine = () => {
    rememberCurrentState();
    setVLines([...vLines, 50]);
  };

  const addHLine = () => {
    rememberCurrentState();
    setHLines([...hLines, 50]);
  };

  // Recalculate zoom on window resize if in CROP or SLICE mode
  useEffect(() => {
    const handleResize = () => {
      if (appMode !== "UPLOAD") {
        handleZoomFit();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [appMode, handleZoomFit]);

  const backgroundPreviewSrc = useMemo(() => {
    if (!imageEdits.removeBackground) return undefined;
    return backgroundRemovedSrc;
  }, [backgroundRemovedSrc, imageEdits.removeBackground]);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* Top Menu Bar */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ImageSquare size={20} weight="fill" className="text-emerald-500" />
            <span className="text-sm font-bold tracking-tight">IconSlicer</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <nav className="flex items-center gap-4 text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
            <span className={appMode === "UPLOAD" ? "text-zinc-100" : ""}>Upload</span>
            <span className="text-zinc-800">/</span>
            <span className={appMode === "CROP" ? "text-zinc-100" : ""}>Crop</span>
            <span className="text-zinc-800">/</span>
            <span className={appMode === "SLICE" ? "text-zinc-100" : ""}>Slice</span>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Undo"
              aria-label="Undo"
              disabled={!image || undoStack.length === 0}
              onClick={handleUndo}
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
            >
              <ArrowUUpLeft size={18} />
            </button>
            <button
              type="button"
              title="Redo"
              aria-label="Redo"
              disabled={!image || redoStack.length === 0}
              onClick={handleRedo}
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
            >
              <ArrowUUpRight size={18} />
            </button>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          {image && (
            <div className="text-[10px] font-mono text-zinc-500 flex gap-3">
              <span>{image.naturalWidth} x {image.naturalHeight} PX</span>
            </div>
          )}
          <div className="h-4 w-px bg-zinc-800" />
          <button 
            onClick={handleReset}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            START OVER
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Palette */}
        <aside className="w-14 border-r border-zinc-800 bg-zinc-900/80 flex flex-col items-center py-4 gap-3 shrink-0">
          <ToolButton label="Upload image" active={appMode === "UPLOAD"} onClick={handleReset}>
            <CloudArrowUp size={24} weight={appMode === "UPLOAD" ? "fill" : "regular"} />
          </ToolButton>
          <ToolButton label="Crop sheet" active={appMode === "CROP"} disabled={!originalImage} onClick={() => setAppMode("CROP")}>
            <Crop size={24} weight={appMode === "CROP" ? "fill" : "regular"} />
          </ToolButton>
          <ToolButton label="Slice grid" active={appMode === "SLICE" && activeTool === "GRID"} disabled={!image} onClick={() => { setAppMode("SLICE"); setActiveTool("GRID"); }}>
            <GridFour size={24} weight={appMode === "SLICE" && activeTool === "GRID" ? "fill" : "regular"} />
          </ToolButton>
          <ToolButton label="Remove background" active={appMode === "SLICE" && activeTool === "BACKGROUND"} disabled={!image} onClick={() => { setAppMode("SLICE"); setActiveTool("BACKGROUND"); }}>
            <Eraser size={24} weight={appMode === "SLICE" && activeTool === "BACKGROUND" ? "fill" : "regular"} />
          </ToolButton>
          <ToolButton label="Hue editor" active={appMode === "SLICE" && activeTool === "HUE"} disabled={!image} onClick={() => { setAppMode("SLICE"); setActiveTool("HUE"); }}>
            <Palette size={24} weight={appMode === "SLICE" && activeTool === "HUE" ? "fill" : "regular"} />
          </ToolButton>
          <ToolButton label="Effects" active={appMode === "SLICE" && activeTool === "EFFECTS"} disabled={!image} onClick={() => { setAppMode("SLICE"); setActiveTool("EFFECTS"); }}>
            <SlidersHorizontal size={24} weight={appMode === "SLICE" && activeTool === "EFFECTS" ? "fill" : "regular"} />
          </ToolButton>
          <div className="mt-auto flex flex-col gap-3">
            <ToolButton label="Export edited sheet" disabled={!image || isProcessing} onClick={handleDownloadEditedImage}>
              <DownloadSimple size={24} />
            </ToolButton>
            <ToolButton label="Reset edits" disabled={!image || !hasVisualEdits(imageEdits)} onClick={resetImageEdits}>
              <ArrowCounterClockwise size={24} />
            </ToolButton>
            <div className="p-2 text-zinc-700" title="Sliced files">
              <Files size={24} />
            </div>
          </div>
        </aside>

        {/* Center Canvas Area */}
        <main ref={canvasAreaRef} className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-950">
          <AnimatePresence mode="wait">
            {appMode === "UPLOAD" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex items-center justify-center p-12"
              >
                <Dropzone onUpload={handleUpload} className="max-w-2xl bg-zinc-900/50 border-zinc-800" />
              </motion.div>
            )}

            {appMode === "CROP" && originalImage && (
              <motion.div
                key="crop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <Cropper 
                  image={originalImage} 
                  crop={crop}
                  setCrop={setCrop}
                  setCompletedCrop={setCompletedCrop}
                  imgRef={imgRef}
                  zoom={zoom}
                />
              </motion.div>
            )}

            {appMode === "SLICE" && image && (
              <motion.div
                key="slice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <Workspace
                  image={image}
                  previewSrc={backgroundPreviewSrc}
                  imageFilter={imageEdits.removeBackground ? "none" : buildImageFilter(imageEdits)}
                  vLines={vLines}
                  hLines={hLines}
                  onUpdateVLines={updateVLines}
                  onUpdateHLines={updateHLines}
                  zoom={zoom}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Properties Panel */}
        <RightPanel 
          mode={appMode}
          onAddVLine={addVLine}
          onAddHLine={addHLine}
          onGenerateGrid={generateGrid}
          onDownload={handleDownload}
          onReset={handleReset}
          onConfirmCrop={handleConfirmCrop}
          isProcessing={isProcessing}
          imageDimensions={image ? { width: image.naturalWidth, height: image.naturalHeight } : undefined}
          gridCount={{ v: vLines.length, h: hLines.length }}
          zoom={zoom}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 3))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
          onZoomFit={handleZoomFit}
          activeTool={activeTool}
          imageEdits={imageEdits}
          onUpdateImageEdits={updateImageEdits}
          onResetImageEdits={resetImageEdits}
          onApplyBackgroundRemoval={applyRembgBackgroundRemoval}
          isRemovingBackground={isRemovingBackground}
          hasBackgroundRemovedImage={Boolean(backgroundRemovedSrc)}
          onDownloadEditedImage={handleDownloadEditedImage}
        />
      </div>

      {/* Status Bar */}
      <footer className="h-6 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-4 text-[9px] uppercase font-bold tracking-widest text-zinc-500">
          <span>{appMode} MODE</span>
          <div className="h-2 w-px bg-zinc-800" />
          <span>v1.0.0</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-600">
          {image && <span>{image.naturalWidth} x {image.naturalHeight} PX</span>}
          <span>READY</span>
        </div>
      </footer>
    </div>
  );
}

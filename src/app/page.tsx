"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Workspace } from "@/components/Workspace";
import { RightPanel } from "@/components/RightPanel";
import { Cropper } from "@/components/Cropper";
import { sliceImage } from "@/lib/slicer";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImageSquare, 
  Crop, 
  GridFour, 
  CloudArrowUp,
  Files
} from "@phosphor-icons/react";
import { Crop as CropState, PixelCrop } from "react-image-crop";

type AppMode = "UPLOAD" | "CROP" | "SLICE";

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>("UPLOAD");
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [vLines, setVLines] = useState<number[]>([]); // percentages
  const [hLines, setHLines] = useState<number[]>([]); // percentages
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const handleUpload = (img: HTMLImageElement) => {
    setOriginalImage(img);
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
      setZoom(calculateFitZoom(croppedImg));
      generateGrid(4, 4);
    };
    croppedImg.src = canvas.toDataURL("image/png");
  };

  const generateGrid = (rows: number, cols: number) => {
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
      const vPixels = vLines.map((p) => (p / 100) * image.naturalWidth);
      const hPixels = hLines.map((p) => (p / 100) * image.naturalHeight);
      const slices = await sliceImage(image, vPixels, hPixels);
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

  const handleReset = () => {
    setAppMode("UPLOAD");
    setOriginalImage(null);
    setImage(null);
    setVLines([]);
    setHLines([]);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setZoom(1);
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
        <aside className="w-14 border-r border-zinc-800 bg-zinc-900/80 flex flex-col items-center py-4 gap-4 shrink-0">
          <div className={`p-2 rounded-lg transition-colors ${appMode === "UPLOAD" ? "bg-zinc-800 text-emerald-500" : "text-zinc-600"}`}>
            <CloudArrowUp size={24} weight={appMode === "UPLOAD" ? "fill" : "regular"} />
          </div>
          <div className={`p-2 rounded-lg transition-colors ${appMode === "CROP" ? "bg-zinc-800 text-emerald-500" : "text-zinc-600"}`}>
            <Crop size={24} weight={appMode === "CROP" ? "fill" : "regular"} />
          </div>
          <div className={`p-2 rounded-lg transition-colors ${appMode === "SLICE" ? "bg-zinc-800 text-emerald-500" : "text-zinc-600"}`}>
            <GridFour size={24} weight={appMode === "SLICE" ? "fill" : "regular"} />
          </div>
          <div className="mt-auto p-2 text-zinc-700">
            <Files size={24} />
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
                  vLines={vLines}
                  hLines={hLines}
                  onUpdateVLines={setVLines}
                  onUpdateHLines={setHLines}
                  zoom={zoom}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Properties Panel */}
        <RightPanel 
          mode={appMode}
          onAddVLine={() => setVLines([...vLines, 50])}
          onAddHLine={() => setHLines([...hLines, 50])}
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

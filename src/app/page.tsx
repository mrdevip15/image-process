"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Workspace } from "@/components/Workspace";
import { Toolbar } from "@/components/Toolbar";
import { Cropper } from "@/components/Cropper";
import { sliceImage } from "@/lib/slicer";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { ImageSquare } from "@phosphor-icons/react";

type AppMode = "UPLOAD" | "CROP" | "SLICE";

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>("UPLOAD");
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [vLines, setVLines] = useState<number[]>([]); // percentages
  const [hLines, setHLines] = useState<number[]>([]); // percentages
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = (img: HTMLImageElement) => {
    setOriginalImage(img);
    setAppMode("CROP");
  };

  const handleCropComplete = (croppedImg: HTMLImageElement) => {
    setImage(croppedImg);
    setAppMode("SLICE");
    generateGrid(4, 4);
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
      // Use natural dimensions for accurate slicing
      const vPixels = vLines.map((p) => (p / 100) * image.naturalWidth);
      const hPixels = hLines.map((p) => (p / 100) * image.naturalHeight);

      const slices = await sliceImage(image, vPixels, hPixels);
      
      const zip = new JSZip();
      slices.forEach((slice) => {
        zip.file(slice.filename, slice.blob);
      });

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "sliced_icons.zip");
    } catch (error) {
      console.error("Slicing failed:", error);
      alert("Failed to slice image. Check console for details.");
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
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center">
      <header className="w-full max-w-7xl px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
            <ImageSquare size={24} className="text-white dark:text-zinc-900" weight="duotone" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-none">IconSlicer</h1>
            <p className="text-xs text-zinc-500 font-medium">Private Image Tools</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {appMode !== "UPLOAD" && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Start Over
            </button>
          )}
          <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs font-mono text-zinc-400">
            {appMode} MODE
          </span>
        </div>
      </header>

      <section className="flex-1 w-full flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {appMode === "UPLOAD" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full flex flex-col items-center"
            >
              <div className="max-w-md text-center mb-12">
                <h2 className="text-4xl font-bold tracking-tighter mb-4">
                  Turn one grid into many icons.
                </h2>
                <p className="text-zinc-500 leading-relaxed">
                  The fastest way to slice icon packs. 
                  Zero server upload, 100% private, instant export.
                </p>
              </div>
              <Dropzone onUpload={handleUpload} />
            </motion.div>
          )}

          {appMode === "CROP" && originalImage && (
            <motion.div
              key="crop"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col items-center"
            >
              <Cropper image={originalImage} onCropComplete={handleCropComplete} />
            </motion.div>
          )}

          {appMode === "SLICE" && image && (
            <motion.div
              key="slice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex-1 flex flex-col"
            >
              <Workspace
                image={image}
                vLines={vLines}
                hLines={hLines}
                onUpdateVLines={setVLines}
                onUpdateHLines={setHLines}
              />
              <Toolbar
                onAddVLine={() => setVLines([...vLines, 50])}
                onAddHLine={() => setHLines([...hLines, 50])}
                onGenerateGrid={generateGrid}
                onDownload={handleDownload}
                onReset={handleReset}
                isProcessing={isProcessing}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="fixed inset-0 -z-50 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </main>
  );
}

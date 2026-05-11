"use client";

import React, { useRef, useEffect } from "react";
import { motion, PanInfo } from "framer-motion";
import { Trash } from "@phosphor-icons/react";

interface WorkspaceProps {
  image: HTMLImageElement;
  vLines: number[]; // percentages (0-100)
  hLines: number[]; // percentages (0-100)
  onUpdateVLines: (lines: number[]) => void;
  onUpdateHLines: (lines: number[]) => void;
}

export function Workspace({
  image,
  vLines,
  hLines,
  onUpdateVLines,
  onUpdateHLines,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      // Just a trigger for re-render if needed
    };
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleVLineDrag = (_: unknown, info: PanInfo, index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = info.point.x - rect.left;
    const newPercent = Math.max(0, Math.min(100, (newX / rect.width) * 100));
    const newLines = [...vLines];
    newLines[index] = newPercent;
    onUpdateVLines(newLines);
  };

  const handleHLineDrag = (_: unknown, info: PanInfo, index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newY = info.point.y - rect.top;
    const newPercent = Math.max(0, Math.min(100, (newY / rect.height) * 100));
    const newLines = [...hLines];
    newLines[index] = newPercent;
    onUpdateHLines(newLines);
  };

  const removeVLine = (index: number) => {
    onUpdateVLines(vLines.filter((_, i) => i !== index));
  };

  const removeHLine = (index: number) => {
    onUpdateHLines(hLines.filter((_, i) => i !== index));
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center gap-8 py-12 px-4">
      <div 
        ref={containerRef}
        className="relative bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800"
        style={{
          aspectRatio: `${image.width} / ${image.height}`,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={image.src} 
          alt="To be sliced" 
          className="w-full h-full object-contain pointer-events-none select-none opacity-90"
        />

        {/* Vertical Lines */}
        {vLines.map((percent, i) => (
          <motion.div
            key={`v-${i}`}
            drag="x"
            dragMomentum={false}
            dragElastic={0}
            onDrag={(e, info) => handleVLineDrag(e, info, i)}
            className="absolute top-0 bottom-0 w-1 bg-emerald-500 cursor-ew-resize group z-10"
            style={{ left: `${percent}%`, x: "-50%" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => removeVLine(i)}
                className="p-1 rounded-full bg-red-500 text-white shadow-lg scale-75 hover:scale-100 transition-transform"
              >
                <Trash size={14} />
              </button>
            </div>
            <div className="absolute inset-y-0 -left-2 -right-2 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}

        {/* Horizontal Lines */}
        {hLines.map((percent, i) => (
          <motion.div
            key={`h-${i}`}
            drag="y"
            dragMomentum={false}
            dragElastic={0}
            onDrag={(e, info) => handleHLineDrag(e, info, i)}
            className="absolute left-0 right-0 h-1 bg-emerald-500 cursor-ns-resize group z-10"
            style={{ top: `${percent}%`, y: "-50%" }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => removeHLine(i)}
                className="p-1 rounded-full bg-red-500 text-white shadow-lg scale-75 hover:scale-100 transition-transform"
              >
                <Trash size={14} />
              </button>
            </div>
            <div className="absolute inset-x-0 -top-2 -bottom-2 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
      
      <div className="text-sm text-zinc-500 font-mono">
        {image.width} × {image.height}px • {vLines.length + 1} × {hLines.length + 1} slices
      </div>
    </div>
  );
}

"use client";

import React, { useRef } from "react";
import { Trash } from "@phosphor-icons/react";

interface WorkspaceProps {
  image: HTMLImageElement;
  vLines: number[]; // percentages (0-100)
  hLines: number[]; // percentages (0-100)
  onUpdateVLines: (lines: number[]) => void;
  onUpdateHLines: (lines: number[]) => void;
  zoom: number;
}

export function Workspace({
  image,
  vLines,
  hLines,
  onUpdateVLines,
  onUpdateHLines,
  zoom
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const startDragging = (
    e: React.PointerEvent, 
    index: number, 
    type: "v" | "h"
  ) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      // Calculate position relative to the container, considering the CSS scale
      if (type === "v") {
        const newX = (moveEvent.clientX - rect.left) / zoom;
        const newPercent = Math.max(0, Math.min(100, (newX / (rect.width / zoom)) * 100));
        const newLines = [...vLines];
        newLines[index] = newPercent;
        onUpdateVLines(newLines);
      } else {
        const newY = (moveEvent.clientY - rect.top) / zoom;
        const newPercent = Math.max(0, Math.min(100, (newY / (rect.height / zoom)) * 100));
        const newLines = [...hLines];
        newLines[index] = newPercent;
        onUpdateHLines(newLines);
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
  };

  const removeVLine = (index: number) => {
    onUpdateVLines(vLines.filter((_, i) => i !== index));
  };

  const removeHLine = (index: number) => {
    onUpdateHLines(hLines.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-8 overflow-auto checkerboard">
      <div 
        ref={containerRef}
        className="relative bg-zinc-950 shadow-2xl ring-1 ring-white/10 transition-transform duration-200 ease-out origin-center"
        style={{
          width: "fit-content",
          height: "fit-content",
          transform: `scale(${zoom})`
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={image.src} 
          alt="To be sliced" 
          className="max-h-[80vh] w-auto block pointer-events-none select-none opacity-90"
        />

        {/* Vertical Lines */}
        {vLines.map((percent, i) => (
          <div
            key={`v-${i}`}
            onPointerDown={(e) => startDragging(e, i, "v")}
            className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize group z-10 touch-none flex items-center justify-center"
            style={{ left: `${percent}%` }}
          >
            <div className="w-0.5 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-colors group-hover:bg-emerald-400" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); removeVLine(i); }}
                className="p-1 rounded-full bg-red-500 text-white shadow-lg scale-75 hover:scale-100 transition-transform pointer-events-auto"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Horizontal Lines */}
        {hLines.map((percent, i) => (
          <div
            key={`h-${i}`}
            onPointerDown={(e) => startDragging(e, i, "h")}
            className="absolute left-0 right-0 h-4 -mt-2 cursor-ns-resize group z-10 touch-none flex flex-col items-center justify-center"
            style={{ top: `${percent}%` }}
          >
            <div className="h-0.5 w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-colors group-hover:bg-emerald-400" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); removeHLine(i); }}
                className="p-1 rounded-full bg-red-500 text-white shadow-lg scale-75 hover:scale-100 transition-transform pointer-events-auto"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

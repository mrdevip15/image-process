"use client";

import React, { useRef, useEffect } from "react";
import { Trash } from "@phosphor-icons/react";
import { ActiveTool } from "@/lib/imageEdits";
import { ImageSelection, SelectionAction, SelectionMode, SelectionPoint, clampPoint, distance, pointsToPath } from "@/lib/selection";

interface WorkspaceProps {
  image: HTMLImageElement;
  previewSrc?: string;
  imageFilter?: string;
  vLines: number[]; // percentages (0-100)
  hLines: number[]; // percentages (0-100)
  onUpdateVLines: (lines: number[]) => void;
  onUpdateHLines: (lines: number[]) => void;
  zoom: number;
  activeTool: ActiveTool;
  selectionMode: SelectionMode;
  onSelectionActionChange: (action: SelectionAction) => void;
  selection?: ImageSelection;
  onSelectionChange: (selection?: ImageSelection) => void;
  onSmartSelect: (point: SelectionPoint) => void;
}

export function Workspace({
  image,
  previewSrc,
  imageFilter = "none",
  vLines,
  hLines,
  onUpdateVLines,
  onUpdateHLines,
  zoom,
  activeTool,
  selectionMode,
  onSelectionActionChange,
  selection,
  onSelectionChange,
  onSmartSelect,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const freehandPointsRef = useRef<SelectionPoint[]>([]);

  // Keyboard shortcuts for Add/Subtract
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool !== "LASSO") return;
      
      if (e.key === "Shift") {
        onSelectionActionChange("add");
      }
      if (e.key === "Alt") {
        e.preventDefault();
        onSelectionActionChange("subtract");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (activeTool !== "LASSO") return;
      if (e.key === "Shift" || e.key === "Alt") {
        onSelectionActionChange("new");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTool, onSelectionActionChange]);

  const eventToImagePoint = (event: Pick<PointerEvent | React.PointerEvent, "clientX" | "clientY">) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return clampPoint(
      {
        x: ((event.clientX - rect.left) / rect.width) * image.naturalWidth,
        y: ((event.clientY - rect.top) / rect.height) * image.naturalHeight,
      },
      image.naturalWidth,
      image.naturalHeight
    );
  };

  const startLasso = (e: React.PointerEvent) => {
    if (activeTool !== "LASSO") return;

    // Update action based on modifiers if not already set by keyboard listener
    if (e.shiftKey) onSelectionActionChange("add");
    else if (e.altKey) onSelectionActionChange("subtract");

    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const point = eventToImagePoint(e);

    if (selectionMode === "smart") {
      onSmartSelect(point);
      return;
    }

    if (selectionMode === "pen") {
      const current = selection?.mode === "pen" && !selection.closed ? selection.points : [];
      if (current.length > 2 && distance(point, current[0]) <= 10 / zoom) {
        onSelectionChange({ mode: "pen", points: current, closed: true });
        return;
      }
      onSelectionChange({ mode: "pen", points: [...current, point], closed: false });
      return;
    }

    target.setPointerCapture(e.pointerId);
    freehandPointsRef.current = [point];
    onSelectionChange({ mode: "freehand", points: [point], closed: false });

    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextPoint = eventToImagePoint(moveEvent);
      const lastPoint = freehandPointsRef.current.at(-1);
      if (lastPoint && distance(lastPoint, nextPoint) < 2 / zoom) return;
      freehandPointsRef.current = [...freehandPointsRef.current, nextPoint];
      onSelectionChange({ mode: "freehand", points: freehandPointsRef.current, closed: false });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      if (freehandPointsRef.current.length > 2) {
        onSelectionChange({ mode: "freehand", points: freehandPointsRef.current, closed: true });
      }
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
  };

  const closePenSelection = (event: React.MouseEvent) => {
    if (activeTool !== "LASSO" || selectionMode !== "pen" || !selection || selection.points.length < 3) return;
    event.preventDefault();
    onSelectionChange({ ...selection, closed: true });
  };

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
      
      // Since we are physically scaling the width/height of the container,
      // rect.width is the current visual width. newX / rect.width is the 0-1 percentage.
      if (type === "v") {
        const newX = (moveEvent.clientX - rect.left);
        const newPercent = Math.max(0, Math.min(100, (newX / rect.width) * 100));
        const newLines = [...vLines];
        newLines[index] = newPercent;
        onUpdateVLines(newLines);
      } else {
        const newY = (moveEvent.clientY - rect.top);
        const newPercent = Math.max(0, Math.min(100, (newY / rect.height) * 100));
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
        onPointerDown={startLasso}
        onDoubleClick={closePenSelection}
        className={`relative bg-zinc-950 shadow-2xl ring-1 ring-white/10 flex-shrink-0 ${activeTool === "LASSO" ? "cursor-crosshair touch-none" : ""}`}
        style={{
          width: image.naturalWidth * zoom,
          height: image.naturalHeight * zoom,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={previewSrc || image.src} 
          alt="To be sliced" 
          style={{ width: '100%', height: '100%', filter: imageFilter }}
          className="block pointer-events-none select-none opacity-90"
        />

        {activeTool === "LASSO" && selection?.maskDataUrl && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none opacity-50 overflow-hidden"
            style={{ width: '100%', height: '100%' }}
          >
            <img 
              src={selection.maskDataUrl} 
              alt="" 
              className="w-full h-full object-fill grayscale invert brightness-200"
              style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 1px #10b981)' }}
            />
          </div>
        )}

        {activeTool === "LASSO" && selection && selection.points.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 z-20"
            width={image.naturalWidth * zoom}
            height={image.naturalHeight * zoom}
            viewBox={`0 0 ${image.naturalWidth * zoom} ${image.naturalHeight * zoom}`}
          >
            <path
              d={pointsToPath(selection.points, zoom, selection.closed)}
              fill={selection.closed ? "rgba(16, 185, 129, 0.12)" : "none"}
              stroke="rgba(5, 150, 105, 0.95)"
              strokeWidth={2}
              strokeDasharray="8 5"
              className="animate-pulse"
            />
            <path
              d={pointsToPath(selection.points, zoom, selection.closed)}
              fill="none"
              stroke="white"
              strokeWidth={1}
              strokeDasharray="8 5"
              strokeDashoffset={8}
            />
            {selectionMode === "pen" && selection.points.map((point, index) => (
              <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={point.x * zoom}
                cy={point.y * zoom}
                r={index === 0 ? 5 : 4}
                fill={index === 0 ? "#10b981" : "#f8fafc"}
                stroke="#064e3b"
                strokeWidth={1.5}
              />
            ))}
          </svg>
        )}

        {/* Vertical Lines */}
        {activeTool !== "LASSO" && vLines.map((percent, i) => (
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
        {activeTool !== "LASSO" && hLines.map((percent, i) => (
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

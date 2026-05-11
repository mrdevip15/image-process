"use client";

import React, { useState } from "react";
import { 
  DownloadSimple, 
  Columns, 
  Rows, 
  PlusCircle, 
  ArrowCounterClockwise,
  CheckCircle,
  Info,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsIn
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface RightPanelProps {
  mode: "UPLOAD" | "CROP" | "SLICE";
  onAddVLine: () => void;
  onAddHLine: () => void;
  onGenerateGrid: (rows: number, cols: number) => void;
  onDownload: () => void;
  onReset: () => void;
  onConfirmCrop: () => void;
  isProcessing: boolean;
  imageDimensions?: { width: number; height: number };
  gridCount?: { v: number; h: number };
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

export function RightPanel({
  mode,
  onAddVLine,
  onAddHLine,
  onGenerateGrid,
  onDownload,
  onReset,
  onConfirmCrop,
  isProcessing,
  imageDimensions,
  gridCount,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit
}: RightPanelProps) {
  const [gridConfig, setGridConfig] = useState({ rows: 4, cols: 4 });

  return (
    <aside className="w-72 border-l border-zinc-800 bg-zinc-900/50 flex flex-col overflow-y-auto shrink-0">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Properties</h2>
        <Info size={14} className="text-zinc-600" />
      </div>

      <div className="flex-1">
        {/* Navigation & Canvas Controls (Always visible if image exists) */}
        {(mode === "CROP" || mode === "SLICE") && (
          <div className="p-4 space-y-4">
            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Canvas View</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onZoomOut}
                className="flex flex-col items-center gap-1.5 py-2 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50"
              >
                <MagnifyingGlassMinus size={16} />
                <span className="text-[9px] font-bold">OUT</span>
              </button>
              <button
                onClick={onZoomFit}
                className="flex flex-col items-center gap-1.5 py-2 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50"
              >
                <ArrowsIn size={16} />
                <span className="text-[9px] font-bold uppercase">{Math.round(zoom * 100)}%</span>
              </button>
              <button
                onClick={onZoomIn}
                className="flex flex-col items-center gap-1.5 py-2 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50"
              >
                <MagnifyingGlassPlus size={16} />
                <span className="text-[9px] font-bold">IN</span>
              </button>
            </div>
            <div className="h-px bg-zinc-800" />
          </div>
        )}

        {mode === "UPLOAD" && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-500 italic">Upload an image to see properties</p>
          </div>
        )}

        {mode === "CROP" && (
          <div className="p-4 pt-0 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Instructions</label>
              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-800">
                Drag the selection handles to isolate your icon grid. Click confirm when ready.
              </p>
            </div>
            
            <button
              onClick={onConfirmCrop}
              className="w-full flex items-center justify-center gap-2 py-3 rounded bg-zinc-100 text-zinc-900 font-bold text-sm hover:bg-white transition-colors"
            >
              <CheckCircle size={18} weight="bold" />
              Confirm Crop
            </button>
          </div>
        )}

        {mode === "SLICE" && (
          <div className="p-4 pt-0 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Grid Generator</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-600 font-mono">ROWS</span>
                  <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                    <input
                      type="number"
                      value={gridConfig.rows}
                      onChange={(e) => setGridConfig({ ...gridConfig, rows: parseInt(e.target.value) || 0 })}
                      className="w-full bg-transparent text-xs font-mono focus:outline-none"
                    />
                    <Rows size={14} className="text-zinc-600" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-600 font-mono">COLS</span>
                  <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
                    <input
                      type="number"
                      value={gridConfig.cols}
                      onChange={(e) => setGridConfig({ ...gridConfig, cols: parseInt(e.target.value) || 0 })}
                      className="w-full bg-transparent text-xs font-mono focus:outline-none"
                    />
                    <Columns size={14} className="text-zinc-600" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => onGenerateGrid(gridConfig.rows, gridConfig.cols)}
                className="w-full py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold transition-colors"
              >
                Apply Grid
              </button>
            </div>

            <div className="h-px bg-zinc-800" />

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Manual Adjust</label>
              <div className="flex gap-2">
                <button
                  onClick={onAddVLine}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-zinc-800 hover:bg-zinc-800 text-[11px] font-medium transition-colors"
                >
                  <PlusCircle size={14} />
                  V-Line
                </button>
                <button
                  onClick={onAddHLine}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-zinc-800 hover:bg-zinc-800 text-[11px] font-medium transition-colors"
                >
                  <PlusCircle size={14} />
                  H-Line
                </button>
              </div>
            </div>

            <div className="h-px bg-zinc-800" />

            {imageDimensions && (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600 uppercase">Width</span>
                  <span>{imageDimensions.width}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 uppercase">Height</span>
                  <span>{imageDimensions.height}px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 uppercase">Slices</span>
                  <span>{gridCount ? (gridCount.v + 1) * (gridCount.h + 1) : 0}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-900 shrink-0">
        <button
          onClick={onDownload}
          disabled={isProcessing || mode !== "SLICE"}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-all",
            isProcessing || mode !== "SLICE"
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          )}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <DownloadSimple size={18} weight="bold" />
          )}
          <span>Download All</span>
        </button>
        
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 rounded text-[11px] font-bold text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <ArrowCounterClockwise size={14} />
          Reset Project
        </button>
      </div>
    </aside>
  );
}

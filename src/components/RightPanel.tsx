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
  ArrowsIn,
  Eraser,
  Palette,
  SlidersHorizontal,
  CircleHalf,
  DropHalf,
  ImageSquare,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ActiveTool, ImageEdits, hasVisualEdits } from "@/lib/imageEdits";

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
  activeTool: ActiveTool;
  imageEdits: ImageEdits;
  onUpdateImageEdits: (edits: Partial<ImageEdits>) => void;
  onResetImageEdits: () => void;
  onDownloadEditedImage: () => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, min, max, unit = "", onChange }: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-zinc-500">{label}</span>
        <span className="font-mono text-zinc-300">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-emerald-500"
        aria-label={label}
      />
    </div>
  );
}

function GridIconLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
      <span className="text-emerald-500">{icon}</span>
      {label}
    </label>
  );
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
  onZoomFit,
  activeTool,
  imageEdits,
  onUpdateImageEdits,
  onResetImageEdits,
  onDownloadEditedImage
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
            {activeTool === "GRID" && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GridIconLabel icon={<Rows size={14} />} label="Grid Generator" />
                  </div>
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
                      title="Add vertical slice line"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-zinc-800 hover:bg-zinc-800 text-[11px] font-medium transition-colors"
                    >
                      <PlusCircle size={14} />
                      V-Line
                    </button>
                    <button
                      onClick={onAddHLine}
                      title="Add horizontal slice line"
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-zinc-800 hover:bg-zinc-800 text-[11px] font-medium transition-colors"
                    >
                      <PlusCircle size={14} />
                      H-Line
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTool === "BACKGROUND" && (
              <div className="space-y-4">
                <GridIconLabel icon={<Eraser size={14} />} label="Remove Background" />
                <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-800">
                  Removes pixels similar to the four image corners. Best for flat white, black, or solid-color icon sheets.
                </p>
                <button
                  onClick={() => onUpdateImageEdits({ removeBackground: !imageEdits.removeBackground })}
                  title="Toggle background removal"
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded font-bold text-sm transition-colors",
                    imageEdits.removeBackground
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  )}
                >
                  <Eraser size={18} weight="bold" />
                  {imageEdits.removeBackground ? "Background Removed" : "Remove Background"}
                </button>
                <SliderControl
                  label="Tolerance"
                  value={imageEdits.backgroundTolerance}
                  min={1}
                  max={100}
                  unit="%"
                  onChange={(value) => onUpdateImageEdits({ backgroundTolerance: value })}
                />
              </div>
            )}

            {activeTool === "HUE" && (
              <div className="space-y-5">
                <GridIconLabel icon={<Palette size={14} />} label="Hue Editor" />
                <SliderControl
                  label="Hue"
                  value={imageEdits.hue}
                  min={0}
                  max={360}
                  unit="°"
                  onChange={(value) => onUpdateImageEdits({ hue: value })}
                />
                <SliderControl
                  label="Saturation"
                  value={imageEdits.saturation}
                  min={0}
                  max={200}
                  unit="%"
                  onChange={(value) => onUpdateImageEdits({ saturation: value })}
                />
                <SliderControl
                  label="Brightness"
                  value={imageEdits.brightness}
                  min={25}
                  max={200}
                  unit="%"
                  onChange={(value) => onUpdateImageEdits({ brightness: value })}
                />
              </div>
            )}

            {activeTool === "EFFECTS" && (
              <div className="space-y-5">
                <GridIconLabel icon={<SlidersHorizontal size={14} />} label="Effects" />
                <SliderControl
                  label="Contrast"
                  value={imageEdits.contrast}
                  min={25}
                  max={200}
                  unit="%"
                  onChange={(value) => onUpdateImageEdits({ contrast: value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateImageEdits({ grayscale: !imageEdits.grayscale })}
                    title="Toggle grayscale"
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded border text-[11px] font-bold transition-colors",
                      imageEdits.grayscale ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-zinc-800 hover:bg-zinc-800"
                    )}
                  >
                    <CircleHalf size={14} />
                    Gray
                  </button>
                  <button
                    onClick={() => onUpdateImageEdits({ invert: !imageEdits.invert })}
                    title="Toggle invert colors"
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded border text-[11px] font-bold transition-colors",
                      imageEdits.invert ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-zinc-800 hover:bg-zinc-800"
                    )}
                  >
                    <DropHalf size={14} />
                    Invert
                  </button>
                </div>
                <button
                  onClick={onDownloadEditedImage}
                  title="Download the edited sheet before slicing"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold transition-colors"
                >
                  <ImageSquare size={15} />
                  Export Edited Sheet
                </button>
              </div>
            )}

            <div className="h-px bg-zinc-800" />

            {hasVisualEdits(imageEdits) && (
              <button
                onClick={onResetImageEdits}
                title="Reset background, hue, and effects"
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-[11px] font-bold text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <ArrowCounterClockwise size={14} />
                Reset Edits
              </button>
            )}

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

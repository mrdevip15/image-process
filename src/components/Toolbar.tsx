"use client";

import React, { useState } from "react";
import { 
  DownloadSimple, 
  Columns, 
  Rows, 
  PlusCircle, 
  ArrowCounterClockwise
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onAddVLine: () => void;
  onAddHLine: () => void;
  onGenerateGrid: (rows: number, cols: number) => void;
  onDownload: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export function Toolbar({
  onAddVLine,
  onAddHLine,
  onGenerateGrid,
  onDownload,
  onReset,
  isProcessing,
}: ToolbarProps) {
  const [gridConfig, setGridConfig] = useState({ rows: 4, cols: 4 });

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-3xl flex items-center gap-8 shadow-2xl z-50 min-w-max"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Rows</label>
            <input
              type="number"
              value={gridConfig.rows}
              onChange={(e) => setGridConfig({ ...gridConfig, rows: parseInt(e.target.value) || 0 })}
              className="w-12 bg-transparent text-sm font-mono focus:outline-none border-b border-zinc-200 dark:border-zinc-800"
            />
          </div>
          <Rows size={16} className="text-zinc-400" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Cols</label>
            <input
              type="number"
              value={gridConfig.cols}
              onChange={(e) => setGridConfig({ ...gridConfig, cols: parseInt(e.target.value) || 0 })}
              className="w-12 bg-transparent text-sm font-mono focus:outline-none border-b border-zinc-200 dark:border-zinc-800"
            />
          </div>
          <Columns size={16} className="text-zinc-400" />
        </div>

        <button
          onClick={() => onGenerateGrid(gridConfig.rows, gridConfig.cols)}
          className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors"
        >
          Generate
        </button>
      </div>

      <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center gap-2">
        <button
          onClick={onAddVLine}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors flex items-center gap-2 text-xs"
          title="Add Vertical Line"
        >
          <PlusCircle size={20} weight="duotone" />
          <span>V-Line</span>
        </button>
        <button
          onClick={onAddHLine}
          className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors flex items-center gap-2 text-xs"
          title="Add Horizontal Line"
        >
          <PlusCircle size={20} weight="duotone" />
          <span>H-Line</span>
        </button>
      </div>

      <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center gap-4">
        <button
          onClick={onReset}
          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 transition-colors"
          title="Reset"
        >
          <ArrowCounterClockwise size={20} />
        </button>
        
        <button
          onClick={onDownload}
          disabled={isProcessing}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-medium transition-all shadow-lg active:scale-95",
            isProcessing
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:shadow-emerald-500/10"
          )}
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <DownloadSimple size={20} weight="bold" />
          )}
          <span>{isProcessing ? "Slicing..." : "Download ZIP"}</span>
        </button>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadSimple } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onUpload: (image: HTMLImageElement) => void;
  className?: string;
}

export function Dropzone({ onUpload, className }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => onUpload(img);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group flex flex-col items-center justify-center w-full max-w-2xl aspect-square md:aspect-video rounded-3xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden",
        isDragActive
          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 scale-[0.99]"
          : "border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <motion.div
        initial={false}
        animate={{
          scale: isDragActive ? 1.1 : 1,
          y: isDragActive ? -10 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center gap-4 text-center p-8"
      >
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors duration-300">
          <UploadSimple size={32} weight="duotone" />
        </div>
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Drop your icon pack here
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            PNG, JPG or WEBP (Max 20MB)
          </p>
        </div>
      </motion.div>

      {/* Decorative background element */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
}

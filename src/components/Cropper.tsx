"use client";

import React, { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { motion } from "framer-motion";
import { CheckCircle } from "@phosphor-icons/react";

interface CropperProps {
  image: HTMLImageElement;
  onCropComplete: (croppedImage: HTMLImageElement) => void;
}

export function Cropper({ image, onCropComplete }: CropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Initial crop: 90% of the image
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;

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
    croppedImg.onload = () => onCropComplete(croppedImg);
    croppedImg.src = canvas.toDataURL("image/png");
  };

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-4 w-full max-w-5xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Crop your image</h2>
        <p className="text-zinc-500 text-sm">Select the area containing your icon grid</p>
      </div>

      <div className="relative bento-card p-4 overflow-hidden max-h-[70vh]">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          className="max-h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={image.src}
            alt="Original"
            onLoad={onImageLoad}
            className="max-h-[60vh] w-auto object-contain"
          />
        </ReactCrop>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConfirm}
        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xl"
      >
        <CheckCircle size={24} weight="bold" />
        <span>Confirm Crop</span>
      </motion.button>
    </div>
  );
}

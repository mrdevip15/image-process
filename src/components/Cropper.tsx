"use client";

import React from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";

interface CropperProps {
  image: HTMLImageElement;
  crop: Crop | undefined;
  setCrop: (crop: Crop) => void;
  setCompletedCrop: (crop: PixelCrop) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
  zoom: number;
}

export function Cropper({ image, crop, setCrop, setCompletedCrop, imgRef, zoom }: CropperProps) {
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-8 overflow-auto checkerboard">
      {/* 
          To fix "weird" cropping behavior when zoomed, we apply the scale 
          only to the wrapper. React-image-crop handles its own events, 
          so we need to ensure the container doesn't mess with its coordinate math.
      */}
      <div 
        className="shadow-2xl ring-1 ring-white/10 origin-center transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={image.src}
            alt="Original"
            onLoad={onImageLoad}
            style={{ 
              // We use natural dimensions and let the parent scale handle the "fit"
              // but we must ensure it doesn't get squished by flex/grid
              maxWidth: 'none' 
            }}
            className="block select-none"
          />
        </ReactCrop>
      </div>
    </div>
  );
}

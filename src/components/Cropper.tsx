"use client";

import React from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";

interface CropperProps {
  image: HTMLImageElement;
  crop: Crop | undefined;
  setCrop: (crop: Crop) => void;
  setCompletedCrop: (crop: PixelCrop) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
}

export function Cropper({ image, crop, setCrop, setCompletedCrop, imgRef }: CropperProps) {
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
      <div className="shadow-2xl ring-1 ring-white/10">
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
            className="max-h-[80vh] w-auto block select-none"
          />
        </ReactCrop>
      </div>
    </div>
  );
}

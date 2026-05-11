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
          Instead of CSS transform: scale, we scale the image dimensions.
          This ensures react-image-crop's internal event handling (which uses getBoundingClientRect)
          remains 100% accurate without coordinate offset bugs.
      */}
      <div className="shadow-2xl ring-1 ring-white/10 flex-shrink-0">
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
              width: image.naturalWidth * zoom,
              height: image.naturalHeight * zoom,
              maxWidth: 'none'
            }}
            className="block select-none"
          />
        </ReactCrop>
      </div>
    </div>
  );
}

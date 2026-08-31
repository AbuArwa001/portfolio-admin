// components/LazyImage.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // For external images that Next.js can't optimize
  const unoptimized = src.startsWith("http");

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-muted-foreground">Image not available</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={!width || !height}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          unoptimized={unoptimized}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
    </div>
  );
};

export default LazyImage;

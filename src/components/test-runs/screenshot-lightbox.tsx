"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface Screenshot {
  url: string;
  label: string | null;
}

interface ScreenshotLightboxProps {
  screenshots: Screenshot[];
  initialIndex: number;
  onClose: () => void;
}

export default function ScreenshotLightbox({
  screenshots,
  initialIndex,
  onClose,
}: ScreenshotLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentScreenshot = screenshots[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    setIsZoomed(false);
  }, [screenshots.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    setIsZoomed(false);
  }, [screenshots.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
        case " ":
          e.preventDefault();
          setIsZoomed((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-lg transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/70 bg-black/50 px-3 py-1.5 rounded-lg text-sm">
        {currentIndex + 1} / {screenshots.length}
      </div>

      {/* Zoom toggle */}
      <button
        onClick={() => setIsZoomed(!isZoomed)}
        className="absolute top-4 left-1/2 -translate-x-1/2 p-2 text-white/70 hover:text-white bg-black/50 rounded-lg transition-colors"
      >
        {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
      </button>

      {/* Navigation buttons */}
      {screenshots.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image container */}
      <div
        className={"flex items-center justify-center w-full h-full p-16 " + (isZoomed ? "overflow-auto cursor-zoom-out" : "cursor-zoom-in")}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <img
          src={currentScreenshot.url}
          alt={currentScreenshot.label || "Screenshot " + (currentIndex + 1)}
          className={"max-h-full rounded-lg shadow-2xl transition-transform duration-200 " + (isZoomed ? "max-w-none scale-150" : "max-w-full object-contain")}
          onClick={() => setIsZoomed(!isZoomed)}
        />
      </div>

      {/* Label */}
      {currentScreenshot.label && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/70 px-4 py-2 rounded-lg">
          {currentScreenshot.label}
        </div>
      )}

      {/* Thumbnail strip */}
      {screenshots.length > 1 && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 overflow-x-auto py-2">
          {screenshots.map((screenshot, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsZoomed(false);
              }}
              className={"w-16 h-12 rounded overflow-hidden border-2 transition-all flex-shrink-0 " + (idx === currentIndex ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100")}
            >
              <img
                src={screenshot.url}
                alt={screenshot.label || "Thumbnail " + (idx + 1)}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

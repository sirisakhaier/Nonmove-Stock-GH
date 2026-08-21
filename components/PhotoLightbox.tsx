"use client";

import React from "react";
import { X } from "lucide-react";

interface PhotoLightboxProps {
  isOpen?: boolean;
  photoUrl: string | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ isOpen = true, photoUrl, onClose }) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity">
      <div className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 transition p-1 bg-white/10 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={photoUrl}
          alt="Evidence Photo Preview"
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/20"
        />
      </div>
    </div>
  );
};

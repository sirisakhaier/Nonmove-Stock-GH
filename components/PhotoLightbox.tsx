"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoLightboxProps {
  isOpen?: boolean;
  photoUrl: string | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ isOpen = true, photoUrl, onClose }) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 hover:bg-white/10 h-8 w-8 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
        <img
          src={photoUrl}
          alt="Evidence Preview"
          className="max-h-[85vh] max-w-full rounded-md object-contain shadow-2xl border border-white/20"
        />
      </div>
    </div>
  );
};

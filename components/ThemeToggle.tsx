"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-8 w-8 rounded-md border border-border bg-card ${className}`} />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)"}
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`h-8 w-8 ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-300" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground animate-in spin-in-180 duration-300" />
      )}
    </Button>
  );
}

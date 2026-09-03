"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  FileSpreadsheet,
  LogOut,
  Layers,
  ShieldAlert,
  TrendingUp,
  Download,
  BarChart3,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import { TEAM_NAME } from "@/lib/version";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [storeInfo, setStoreInfo] = useState<{ branchCode?: string; branchName?: string; userName?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nonmove_user_session");
      if (stored) {
        setStoreInfo(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  const handleExit = () => {
    localStorage.removeItem("nonmove_user_session");
    document.cookie = "user_session=; path=/; max-age=0;";
    router.push("/");
  };

  const branchCode = storeInfo?.branchCode;
  const isViewerPage = pathname.startsWith("/viewer");
  const isAdminPage = pathname.startsWith("/admin");
  const isRootPage = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
        {/* Brand Lockup & Prominent Store Name for Store Users */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/logo.png"
              alt="Haier"
              className="h-7 w-auto object-contain shrink-0 rounded-sm"
            />
            <div className="hidden sm:block border-l border-border pl-2.5">
              <span className="text-xs font-bold text-foreground leading-none block">
                Non-Move Stock Management
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                {TEAM_NAME}
              </span>
            </div>
          </Link>

          {/* Prominent Store Name in Top Zone for Store Users */}
          {branchCode && !isViewerPage && !isAdminPage && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/25 text-foreground font-bold text-xs truncate max-w-[190px] sm:max-w-[320px]">
              <Store className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col text-left truncate leading-tight">
                <span className="font-bold text-xs text-foreground truncate">
                  {storeInfo?.branchName || branchCode}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal truncate hidden sm:inline">
                  {branchCode} {storeInfo?.userName ? `· ${storeInfo.userName}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 text-xs font-medium shrink-0">
          {/* Store User Navigation (Removed 'แนวโน้ม' per request) */}
          {branchCode && !isViewerPage && !isAdminPage && (
            <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border gap-1">
              <Link
                href={`/dashboard/${branchCode}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  pathname === `/dashboard/${branchCode}`
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                <span>รายละเอียด</span>
              </Link>

              <Link
                href={`/dashboard/${branchCode}/requests`}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  pathname.includes("/requests")
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">รายการคำขอ</span>
                <span className="sm:hidden">คำขอ</span>
              </Link>
            </div>
          )}

          {/* Executive Viewer Navigation (3 Tabs) */}
          {isViewerPage && (
            <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border gap-1">
              <Link
                href="/viewer/one-day"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  pathname.startsWith("/viewer/one-day")
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                }`}
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>วิเคราะห์ 1 วัน (1-Day)</span>
              </Link>

              <Link
                href="/viewer/trend"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  pathname === "/viewer/trend" || pathname === "/viewer"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>วิเคราะห์แนวโน้ม (Trend)</span>
              </Link>

              <Link
                href="/viewer/raw-data"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  pathname.startsWith("/viewer/raw-data")
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>RAW Data</span>
              </Link>
            </div>
          )}

          {/* Admin Management Navigation Badge */}
          {isAdminPage && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs border border-primary/20">
              <ShieldAlert className="h-4 w-4 text-primary-foreground" />
              <span>Admin Management Hub</span>
            </div>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {!isRootPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExit}
              className="h-8 text-xs font-medium text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span>ออก</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

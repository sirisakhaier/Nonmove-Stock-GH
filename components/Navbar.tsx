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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
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
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 text-xs font-medium">
          {branchCode && !isViewerPage && !isAdminPage && (
            <>
              <Link
                href={`/dashboard/${branchCode}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === `/dashboard/${branchCode}`
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                <span>รายละเอียด</span>
              </Link>

              <Link
                href={`/dashboard/${branchCode}/trend`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.includes("/trend")
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>แนวโน้ม</span>
              </Link>

              <Link
                href={`/dashboard/${branchCode}/requests`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.includes("/requests")
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">รายการคำขอ</span>
                <span className="sm:hidden">คำขอ</span>
              </Link>
            </>
          )}

          {isViewerPage && (
            <div className="flex items-center gap-1">
              <Link
                href="/viewer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === "/viewer"
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>ภาพรวมและวิเคราะห์</span>
              </Link>
              <Link
                href="/viewer/raw-data"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith("/viewer/raw-data")
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>ดาวน์โหลด RAW Data</span>
              </Link>
            </div>
          )}

          {isAdminPage && (
            <Badge variant="outline" className="gap-1.5 font-medium">
              <ShieldAlert className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              <span>Admin Hub</span>
            </Badge>
          )}
        </nav>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {storeInfo?.branchCode && !isViewerPage && !isAdminPage && (
            <div className="text-right hidden md:block text-[11px] leading-tight pr-1">
              <div className="font-medium text-foreground">
                {storeInfo.branchName || storeInfo.branchCode}
              </div>
              <div className="text-muted-foreground text-[10px]">
                {storeInfo.userName ? `ผู้ใช้งาน: ${storeInfo.userName}` : storeInfo.branchCode}
              </div>
            </div>
          )}

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

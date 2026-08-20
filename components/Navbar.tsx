"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  FileSpreadsheet,
  BarChart3,
  LogOut,
  ChevronRight,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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

  const handleLogout = () => {
    localStorage.removeItem("nonmove_user_session");
    document.cookie = "user_session=; path=/; max-age=0;";
    router.push("/");
  };

  const branchCode = storeInfo?.branchCode;
  const isViewerPage = pathname.startsWith("/viewer");
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-500 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white leading-tight block">
                Non-Move Stock
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links: Store User Only (No Viewer/Admin in store bar) */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          {branchCode && !isViewerPage && !isAdminPage && (
            <>
              <Link
                href={`/dashboard/${branchCode}`}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  pathname.startsWith("/dashboard/") && !pathname.includes("/requests")
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Store className="h-4 w-4" />
                แดชบอร์ดสาขา
              </Link>
              <Link
                href={`/dashboard/${branchCode}/requests`}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  pathname.includes("/requests")
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                รายการคำขอของฉัน
              </Link>
            </>
          )}

          {isViewerPage && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                โหมดภาพรวมผู้บริหาร (Viewer Portal)
              </span>
            </div>
          )}

          {isAdminPage && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                โหมดผู้ดูแลระบบ (Admin Portal)
              </span>
            </div>
          )}
        </nav>

        {/* Right Info / Actions & ThemeToggle */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {storeInfo?.branchCode ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {storeInfo.branchName || storeInfo.branchCode}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {storeInfo.userName ? `ผู้ใช้งาน: ${storeInfo.userName}` : storeInfo.branchCode}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="เปลี่ยนสาขา"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">เปลี่ยนสาขา</span>
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 dark:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Store className="h-3.5 w-3.5" />
              เข้าสู่ระบบสาขา
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

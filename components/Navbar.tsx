"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Layers,
} from "lucide-react";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 leading-tight block">
                Non-Move Stock
              </span>
              <span className="text-xs text-slate-500 block">
                ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          {branchCode && (
            <>
              <Link
                href={`/dashboard/${branchCode}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname.startsWith("/dashboard/") && !pathname.includes("/requests")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Store className="h-4 w-4" />
                แดชบอร์ดสาขา
              </Link>
              <Link
                href={`/dashboard/${branchCode}/requests`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname.includes("/requests")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                รายการคำขอของฉัน
              </Link>
            </>
          )}

          <Link
            href="/viewer"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith("/viewer")
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="h-4 w-4" />
            ภาพรวมทุกสาขา (Viewer)
          </Link>

          <Link
            href="/approvals"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith("/approvals")
                ? "bg-amber-50 text-amber-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            อนุมัติคำขอ (Approvals)
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith("/admin")
                ? "bg-purple-50 text-purple-700 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            จัดการระบบ (Admin)
          </Link>
        </nav>

        {/* Right Info / Actions */}
        <div className="flex items-center gap-3">
          {storeInfo?.branchCode ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-800">
                  {storeInfo.branchName || storeInfo.branchCode}
                </div>
                <div className="text-[11px] text-slate-500">
                  {storeInfo.userName ? `ผู้ใช้งาน: ${storeInfo.userName}` : storeInfo.branchCode}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="เปลี่ยนสาขา"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">เปลี่ยนสาขา</span>
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
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

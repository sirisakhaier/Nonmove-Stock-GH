"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, FileText, CheckSquare, Upload, ArrowLeftRight, Activity } from "lucide-react";

interface NavbarProps {
  branchCode?: string;
  storeName?: string;
  staffName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ branchCode, storeName, staffName }) => {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-sky-600 hover:text-sky-700 transition">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">Non-Move Stock</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                GH Analytics
              </span>
            </div>
          </Link>

          {branchCode && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200 text-sm text-slate-600">
              <Store className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{branchCode}</span>
              {storeName && <span className="text-slate-500 truncate max-w-xs">· {storeName}</span>}
              {staffName && (
                <span className="ml-2 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  👤 {staffName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {branchCode && (
            <>
              <Link
                href={`/dashboard/${branchCode}`}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pathname === `/dashboard/${branchCode}`
                    ? "bg-sky-50 text-sky-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href={`/dashboard/${branchCode}/requests`}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  pathname.includes("/requests")
                    ? "bg-sky-50 text-sky-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Requests</span>
              </Link>
            </>
          )}

          <Link
            href="/approvals"
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              pathname === "/approvals"
                ? "bg-amber-50 text-amber-800 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <CheckSquare className="w-4 h-4 text-amber-500" />
            <span>Approvals</span>
          </Link>

          <Link
            href="/admin/upload"
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              pathname === "/admin/upload"
                ? "bg-emerald-50 text-emerald-800 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Upload Report</span>
          </Link>

          {branchCode && (
            <Link
              href="/"
              className="flex items-center space-x-1 ml-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition"
              title="Switch to another store"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch Store</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

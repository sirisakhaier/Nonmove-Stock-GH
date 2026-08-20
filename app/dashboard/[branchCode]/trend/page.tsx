"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { NonmoveTrendAnalysis } from "@/components/NonmoveTrendAnalysis";
import {
  Calendar,
  Store,
  RefreshCw,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { TEAM_NAME } from "@/lib/version";

export default function StoreTrendPage() {
  const params = useParams();
  const router = useRouter();
  const branchCode = params.branchCode as string;

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [storeInfo, setStoreInfo] = useState<{ branchCode: string; branchName: string; region: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDates = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = new URL("/api/nonmove/summary", window.location.origin);
      url.searchParams.set("branchCode", branchCode);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.store) setStoreInfo(data.store);
        if (data.availableDates) setAvailableDates(data.availableDates);
        if (!selectedDate && data.selectedDate) setSelectedDate(data.selectedDate);
      }
    } catch (err) {
      console.error("Error fetching dates for trend page:", err);
    } finally {
      setIsLoading(false);
    }
  }, [branchCode, selectedDate]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {storeInfo?.branchName || branchCode}
                </h1>
                <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {branchCode}
                </span>
                {storeInfo?.region && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {storeInfo.region}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                วิเคราะห์แนวโน้มการเปลี่ยนแปลงสต๊อกสินค้าไม่เคลื่อนไหวประจำสาขา (Day-by-Day Trend) · {TEAM_NAME}
              </p>
            </div>
          </div>

          {/* Date Selector & Refresh Button */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {availableDates.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 shadow-inner">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      รอบวันที่: {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={fetchDates}
              title="รีเฟรชข้อมูล"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-2.5 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Full Trend & Day-by-Day Gap Analysis Component */}
        <NonmoveTrendAnalysis branchCode={branchCode} selectedDate={selectedDate} />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div>&copy; 2026 Non-Move Stock App · <strong>{TEAM_NAME}</strong></div>
      </footer>
    </div>
  );
}

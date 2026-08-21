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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-9 w-9 shrink-0"
            >
              <Link href={`/dashboard/${branchCode}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {storeInfo?.branchName || branchCode}
                </h1>
                <Badge variant="outline" className="text-xs font-mono">
                  {branchCode}
                </Badge>
                {storeInfo?.region && (
                  <Badge variant="secondary" className="text-xs">
                    ภาค {storeInfo.region}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                วิเคราะห์แนวโน้มการเปลี่ยนแปลงสต๊อกสินค้าไม่เคลื่อนไหวประจำสาขา
              </p>
            </div>
          </div>

          {/* Date Selector & Refresh Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-medium text-foreground focus:outline-hidden cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d} className="bg-background text-foreground">
                      รอบวันที่: {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={fetchDates}
              title="รีเฟรช"
              className="h-8 w-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Trend Analysis Component */}
        <NonmoveTrendAnalysis branchCode={branchCode} selectedDate={selectedDate} />
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        Non-Move Stock Analysis System &copy; 2026
      </footer>
    </div>
  );
}

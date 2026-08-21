"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { KpiCards } from "@/components/KpiCards";
import { ModelExplorerTable } from "@/components/ModelExplorerTable";
import { ActionPanel } from "@/components/ActionPanel";
import { Calendar, Store, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BranchDashboardPage() {
  const params = useParams();
  const branchCode = params.branchCode as string;

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBucket, setSelectedBucket] = useState("ALL");
  const [selectedSkuType, setSelectedSkuType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [categories, setCategories] = useState<string[]>([]);
  const [skuTypes, setSkuTypes] = useState<string[]>(["SELLABLE", "DEMO", "MOCK_UP"]);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  const [selectedProductForAction, setSelectedProductForAction] = useState<any | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Summary & Available Dates
  const fetchSummary = useCallback(async (date?: string) => {
    try {
      const url = new URL("/api/nonmove/summary", window.location.origin);
      url.searchParams.set("branchCode", branchCode);
      if (date) url.searchParams.set("date", date);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setAvailableDates(data.availableDates || []);
        if (!selectedDate && data.selectedDate) {
          setSelectedDate(data.selectedDate);
        }
        setCategories(data.categories || []);
        if (data.skuTypes) setSkuTypes(data.skuTypes);
        setStoreInfo(data.store || null);
      }
    } catch (e) {
      console.error("Error fetching summary:", e);
    }
  }, [branchCode, selectedDate]);

  // 2. Fetch Product List
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/nonmove", window.location.origin);
      url.searchParams.set("branchCode", branchCode);
      if (selectedDate) url.searchParams.set("date", selectedDate);
      if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
      if (selectedBucket !== "ALL") url.searchParams.set("bucket", selectedBucket);
      if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
      if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
      if (search.trim()) url.searchParams.set("search", search.trim());
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setIsLoading(false);
    }
  }, [branchCode, selectedDate, selectedCategory, selectedBucket, selectedSkuType, selectedStatus, search, page, limit]);

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [fetchSummary, selectedDate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleExport = () => {
    const url = new URL("/api/nonmove/export", window.location.origin);
    url.searchParams.set("branchCode", branchCode);
    if (selectedDate) url.searchParams.set("date", selectedDate);
    if (selectedCategory !== "ALL") url.searchParams.set("category", selectedCategory);
    if (selectedBucket !== "ALL") url.searchParams.set("bucket", selectedBucket);
    if (selectedSkuType !== "ALL") url.searchParams.set("skuType", selectedSkuType);
    if (selectedStatus !== "ALL") url.searchParams.set("status", selectedStatus);
    if (search.trim()) url.searchParams.set("search", search.trim());

    window.open(url.toString(), "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {storeInfo?.storeNameCust || storeInfo?.storeName || branchCode}
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
                รายการสต๊อกสินค้าไม่เคลื่อนไหวในสาขา (&gt;30 วัน)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
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
              onClick={() => {
                fetchSummary(selectedDate);
                fetchProducts();
              }}
              title="รีเฟรชข้อมูล"
              className="h-8 w-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards data={summary?.kpis || {}} />

        {/* Model Explorer Table */}
        <ModelExplorerTable
          data={products}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          search={search}
          onSearchChange={(s) => { setSearch(s); setPage(1); }}
          selectedCategory={selectedCategory}
          onCategoryChange={(c) => { setSelectedCategory(c); setPage(1); }}
          selectedBucket={selectedBucket}
          onBucketChange={(b) => { setSelectedBucket(b); setPage(1); }}
          selectedSkuType={selectedSkuType}
          onSkuTypeChange={(st) => { setSelectedSkuType(st); setPage(1); }}
          selectedStatus={selectedStatus}
          onStatusChange={(st) => { setSelectedStatus(st); setPage(1); }}
          categories={categories}
          skuTypes={skuTypes}
          highPct={summary?.kpis?.highNonmoveRatio || 0}
          okPct={summary?.kpis?.okRatio || 0}
          onSelectProduct={(p) => {
            setSelectedProductForAction(p);
            setIsActionOpen(true);
          }}
          onExport={handleExport}
        />
      </main>

      {/* Action Panel Modal */}
      {isActionOpen && (
        <ActionPanel
          isOpen={isActionOpen}
          onClose={() => setIsActionOpen(false)}
          product={selectedProductForAction}
          branchCode={branchCode}
          onSuccess={() => {
            fetchSummary(selectedDate);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}

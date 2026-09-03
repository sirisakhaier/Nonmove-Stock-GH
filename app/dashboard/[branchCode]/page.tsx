"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { UserModuleFilterBar } from "@/components/UserModuleFilterBar";
import { KpiCards } from "@/components/KpiCards";
import { NonmovePeriodKpiTable } from "@/components/NonmovePeriodKpiTable";
import { ModelExplorerTable } from "@/components/ModelExplorerTable";
import { ActionPanel } from "@/components/ActionPanel";
import { Calendar, Store, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NONMOVE_BUCKET_ORDER } from "@/lib/nonmoveConfig";

const DEFAULT_CATEGORIES = ["TV", "WH", "FZ", "WM", "RF", "AC", "SDA"];

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
  const [selectedStatus, setSelectedStatus] = useState("HIGH"); // Default show Nonmove model per request
  const [categories, setCategories] = useState<string[]>([]);
  const [skuTypes, setSkuTypes] = useState<string[]>(["SELLABLE", "DEMO", "MOCK_UP"]);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  // 3 Multi-Check Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>(Array.from(NONMOVE_BUCKET_ORDER));
  const [selectedSkuTypes, setSelectedSkuTypes] = useState<string[]>(["SELLABLE"]);

  const [selectedProductForAction, setSelectedProductForAction] = useState<any | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Summary & Available Dates with active filters
  const fetchSummary = useCallback(async (
    date?: string,
    cats?: string[],
    bcks?: string[],
    types?: string[]
  ) => {
    try {
      const url = new URL("/api/nonmove/summary", window.location.origin);
      url.searchParams.set("branchCode", branchCode);
      if (date) url.searchParams.set("date", date);

      const activeCats = cats !== undefined ? cats : selectedCategories;
      if (activeCats.length > 0) {
        url.searchParams.set("category", activeCats.join(","));
      }

      const activeBcks = bcks !== undefined ? bcks : selectedBuckets;
      if (activeBcks.length > 0) {
        url.searchParams.set("bucket", activeBcks.join(","));
      }

      const activeTypes = types !== undefined ? types : selectedSkuTypes;
      if (activeTypes.length > 0) {
        url.searchParams.set("skuType", activeTypes.join(","));
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setAvailableDates(data.availableDates || []);
        if (!selectedDate && data.selectedDate) {
          setSelectedDate(data.selectedDate);
        }
        if (data.categories) {
          setCategories(data.categories);
        }
        if (data.skuTypes && data.skuTypes.length > 0) {
          setSkuTypes(data.skuTypes);
        }
        setStoreInfo(data.store || null);
      }
    } catch (e) {
      console.error("Error fetching summary:", e);
    }
  }, [branchCode, selectedDate, selectedCategories, selectedBuckets, selectedSkuTypes]);

  // 2. Fetch Product List with active filters
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/nonmove", window.location.origin);
      url.searchParams.set("branchCode", branchCode);
      if (selectedDate) url.searchParams.set("date", selectedDate);

      if (selectedCategories.length > 0) {
        url.searchParams.set("category", selectedCategories.join(","));
      }
      if (selectedBuckets.length > 0) {
        url.searchParams.set("bucket", selectedBuckets.join(","));
      }
      if (selectedSkuTypes.length > 0) {
        url.searchParams.set("skuType", selectedSkuTypes.join(","));
      }
      if (selectedStatus !== "ALL") {
        url.searchParams.set("status", selectedStatus);
      }
      if (search.trim()) {
        url.searchParams.set("search", search.trim());
      }
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
  }, [branchCode, selectedDate, selectedCategories, selectedBuckets, selectedSkuTypes, selectedStatus, search, page, limit]);

  // Trigger summary fetch when filters or date change
  useEffect(() => {
    fetchSummary(selectedDate, selectedCategories, selectedBuckets, selectedSkuTypes);
  }, [selectedDate, selectedCategories, selectedBuckets, selectedSkuTypes]);

  // Trigger products fetch when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset filter handler
  const handleResetFilters = () => {
    const defaultCats = categories.filter((c) => !["CAC", "KT"].includes(c.toUpperCase()));
    setSelectedCategories(defaultCats.length > 0 ? defaultCats : categories);
    setSelectedBuckets(Array.from(NONMOVE_BUCKET_ORDER));
    setSelectedSkuTypes(["SELLABLE"]);
    setSelectedStatus("HIGH");
    setPage(1);
  };

  const handleExport = () => {
    const url = new URL("/api/nonmove/export", window.location.origin);
    url.searchParams.set("branchCode", branchCode);
    if (selectedDate) url.searchParams.set("date", selectedDate);
    if (selectedCategories.length > 0) url.searchParams.set("category", selectedCategories.join(","));
    if (selectedBuckets.length > 0) url.searchParams.set("bucket", selectedBuckets.join(","));
    if (selectedSkuTypes.length > 0) url.searchParams.set("skuType", selectedSkuTypes.join(","));
    window.location.href = url.toString();
  };

  const handleSelectProduct = (prod: any) => {
    setSelectedProductForAction(prod);
    setIsActionOpen(true);
  };

  const handleActionSuccess = () => {
    fetchProducts();
    fetchSummary(selectedDate, selectedCategories, selectedBuckets, selectedSkuTypes);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Header Bar with Prominent Store Info & Date Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-xs">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {storeInfo?.branchName || branchCode}
                </h1>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {branchCode}
                </Badge>
                {storeInfo?.region && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    ภาค {storeInfo.region}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                รายการสต๊อกสินค้าไม่เคลื่อนไหวในสาขา (&gt;30 วัน)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Selector */}
            {availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">รอบข้อมูล:</span>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent font-semibold text-foreground focus:outline-hidden cursor-pointer"
                >
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchSummary(selectedDate, selectedCategories, selectedBuckets, selectedSkuTypes);
                fetchProducts();
              }}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>รีเฟรช</span>
            </Button>
          </div>
        </div>

        {/* 2. Top Filter Bar (Above KPI Cards, affects KPI Cards & Table) */}
        <UserModuleFilterBar
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoriesChange={(cats) => {
            setSelectedCategories(cats);
            setPage(1);
          }}
          selectedBuckets={selectedBuckets}
          onBucketsChange={(bcks) => {
            setSelectedBuckets(bcks);
            setPage(1);
          }}
          skuTypes={skuTypes}
          selectedSkuTypes={selectedSkuTypes}
          onSkuTypesChange={(types) => {
            setSelectedSkuTypes(types);
            setPage(1);
          }}
          onResetFilters={handleResetFilters}
        />

        {/* 3. KPI Cards (Recalculates based on Top Filters) */}
        <KpiCards data={summary?.kpis} />

        {/* 4. New KPI Table: How many SKU in 4 Non-Move Periods and % vs Total SKU */}
        <NonmovePeriodKpiTable
          data={summary?.periodKpis}
          totalSkus={summary?.kpis?.totalSkus}
          totalQty={summary?.kpis?.totalStockQty}
          totalValue={summary?.kpis?.totalStockValue}
        />

        {/* 5. Model Explorer Table */}
        <ModelExplorerTable
          data={products}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          search={search}
          onSearchChange={(newSearch) => {
            setSearch(newSearch);
            setPage(1);
          }}
          selectedStatus={selectedStatus}
          onStatusChange={(newStatus) => {
            setSelectedStatus(newStatus);
            setPage(1);
          }}
          highPct={summary?.kpis?.highNonmoveRatio ?? 0}
          okPct={summary?.kpis?.overallOkPct ?? 0}
          onSelectProduct={handleSelectProduct}
          onExport={handleExport}
        />
      </main>

      {/* Action Drawer/Modal */}
      {selectedProductForAction && (
        <ActionPanel
          isOpen={isActionOpen}
          onClose={() => setIsActionOpen(false)}
          branchCode={branchCode}
          product={selectedProductForAction}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}

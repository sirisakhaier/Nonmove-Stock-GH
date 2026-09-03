"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Package,
  SlidersHorizontal,
  Boxes,
  ChevronDown,
  Check,
  RotateCcw,
  CheckSquare,
  Square,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NONMOVE_BUCKET_ORDER } from "@/lib/nonmoveConfig";

interface UserModuleFilterBarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (cats: string[]) => void;
  selectedBuckets: string[];
  onBucketsChange: (buckets: string[]) => void;
  skuTypes: string[];
  selectedSkuTypes: string[];
  onSkuTypesChange: (types: string[]) => void;
  onResetFilters: () => void;
}

export function UserModuleFilterBar({
  categories,
  selectedCategories,
  onCategoriesChange,
  selectedBuckets,
  onBucketsChange,
  skuTypes,
  selectedSkuTypes,
  onSkuTypesChange,
  onResetFilters,
}: UserModuleFilterBarProps) {
  // Popover open states
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // Local pending states inside open popovers
  const [pendingCats, setPendingCats] = useState<string[]>(selectedCategories);
  const [pendingBuckets, setPendingBuckets] = useState<string[]>(selectedBuckets);
  const [pendingTypes, setPendingTypes] = useState<string[]>(selectedSkuTypes);

  // Sync pending states when props change
  useEffect(() => {
    setPendingCats(selectedCategories);
  }, [selectedCategories]);

  useEffect(() => {
    setPendingBuckets(selectedBuckets);
  }, [selectedBuckets]);

  useEffect(() => {
    setPendingTypes(selectedSkuTypes);
  }, [selectedSkuTypes]);

  // Click outside listeners
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catRef.current && !catRef.current.contains(event.target as Node)) {
        setIsCatOpen(false);
      }
      if (bucketRef.current && !bucketRef.current.contains(event.target as Node)) {
        setIsBucketOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Category helpers ---
  const handleTogglePendingCat = (c: string) => {
    if (pendingCats.includes(c)) {
      if (pendingCats.length > 1) {
        setPendingCats(pendingCats.filter((x) => x !== c));
      }
    } else {
      setPendingCats([...pendingCats, c]);
    }
  };

  const handleApplyCats = () => {
    onCategoriesChange(pendingCats);
    setIsCatOpen(false);
  };

  const getCatDisplayText = () => {
    if (categories.length === 0) return "กำลังโหลดหมวดหมู่...";
    if (selectedCategories.length === categories.length) return "ทุก Category (All)";
    // Check if default (all except CAC, KT)
    const nonCacKt = categories.filter((c) => !["CAC", "KT"].includes(c.toUpperCase()));
    const isDefault =
      nonCacKt.length > 0 &&
      selectedCategories.length === nonCacKt.length &&
      nonCacKt.every((c) => selectedCategories.includes(c));
    if (isDefault) return `${selectedCategories.length}/${categories.length} หมวด (ไม่รวม CAC, KT)`;
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `เลือก ${selectedCategories.length}/${categories.length} หมวด`;
  };

  // --- Bucket helpers ---
  const handleTogglePendingBucket = (b: string) => {
    if (pendingBuckets.includes(b)) {
      if (pendingBuckets.length > 1) {
        setPendingBuckets(pendingBuckets.filter((x) => x !== b));
      }
    } else {
      setPendingBuckets([...pendingBuckets, b]);
    }
  };

  const handleApplyBuckets = () => {
    onBucketsChange(pendingBuckets);
    setIsBucketOpen(false);
  };

  const getBucketDisplayText = () => {
    if (selectedBuckets.length === NONMOVE_BUCKET_ORDER.length) return "ทุกช่วงวัน (All)";
    if (selectedBuckets.length === 1) {
      const b = selectedBuckets[0];
      return b === "121 up" ? "121 วันขึ้นไป" : `${b} วัน`;
    }
    return `เลือก ${selectedBuckets.length} ช่วงวัน`;
  };

  // --- Type helpers ---
  const handleTogglePendingType = (t: string) => {
    if (pendingTypes.includes(t)) {
      if (pendingTypes.length > 1) {
        setPendingTypes(pendingTypes.filter((x) => x !== t));
      }
    } else {
      setPendingTypes([...pendingTypes, t]);
    }
  };

  const handleApplyTypes = () => {
    onSkuTypesChange(pendingTypes);
    setIsTypeOpen(false);
  };

  const getTypeDisplayText = () => {
    if (selectedSkuTypes.length === skuTypes.length && skuTypes.length > 1) return "ทุกประเภท (All)";
    if (selectedSkuTypes.length === 1 && selectedSkuTypes[0] === "SELLABLE") return "Sellable (สินค้าจำหน่าย)";
    if (selectedSkuTypes.length === 1) return selectedSkuTypes[0];
    return `เลือก ${selectedSkuTypes.length} ประเภท`;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary shrink-0" />
          <span className="font-bold text-xs text-foreground">
            ตัวกรองสต๊อกสาขา (ส่งผลต่อการ์ด KPI และตารางด้านล่าง)
          </span>
          <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
            {selectedCategories.length} หมวด · {selectedBuckets.length} ช่วงวัน · {selectedSkuTypes.length} ประเภท
          </Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="h-7 text-xs gap-1.5"
          title="รีเซ็ตค่าเริ่มต้น: ทุกหมวดหมู่ (ไม่รวม CAC,KT), ทุกช่วงวัน, เฉพาะ Sellable"
        >
          <RotateCcw className="h-3 w-3" />
          <span>รีเซ็ตตัวกรอง</span>
        </Button>
      </div>

      {/* 3 Dropdown Popovers in Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Category Multi-Check Popover */}
        <div className="relative" ref={catRef}>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            หมวดหมู่ (Category)
          </label>
          <button
            type="button"
            onClick={() => {
              setPendingCats(selectedCategories);
              setIsCatOpen(!isCatOpen);
            }}
            className="w-full flex items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground hover:bg-muted/40 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Package className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold truncate">{getCatDisplayText()}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>

          {isCatOpen && (
            <div className="absolute z-50 left-0 mt-1.5 w-72 rounded-lg border border-border bg-card p-3 shadow-xl space-y-2 animate-in fade-in-80 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground text-xs">เลือกหมวดหมู่</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPendingCats(Array.from(categories))}
                    className="text-primary hover:underline font-medium"
                  >
                    ทั้งหมด
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={() => setPendingCats(categories.filter((c) => !["CAC", "KT"].includes(c.toUpperCase())))}
                    className="text-primary hover:underline font-medium"
                  >
                    ไม่รวม CAC, KT
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {categories.map((c) => {
                  const isChecked = pendingCats.includes(c);
                  const isExcludedDefault = ["CAC", "KT"].includes(c.toUpperCase());
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleTogglePendingCat(c)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{c}</span>
                        {isExcludedDefault && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded-xs">
                            ค่าเริ่มต้นไม่เลือก
                          </span>
                        )}
                      </div>
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyCats}
                  className="h-8 text-xs font-semibold px-3.5 gap-1.5 w-full"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>ยืนยันการเลือก</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Non-Move Period Multi-Check Popover */}
        <div className="relative" ref={bucketRef}>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            ช่วงวันไม่เคลื่อนไหว (Period)
          </label>
          <button
            type="button"
            onClick={() => {
              setPendingBuckets(selectedBuckets);
              setIsBucketOpen(!isBucketOpen);
            }}
            className="w-full flex items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground hover:bg-muted/40 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold truncate">{getBucketDisplayText()}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>

          {isBucketOpen && (
            <div className="absolute z-50 left-0 mt-1.5 w-64 rounded-lg border border-border bg-card p-3 shadow-xl space-y-2 animate-in fade-in-80 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground text-xs">เลือกช่วงวัน (4 กลุ่ม)</span>
                <button
                  type="button"
                  onClick={() => setPendingBuckets(Array.from(NONMOVE_BUCKET_ORDER))}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  เลือกทั้งหมด
                </button>
              </div>

              <div className="space-y-1">
                {NONMOVE_BUCKET_ORDER.map((b) => {
                  const isChecked = pendingBuckets.includes(b);
                  const isNonmove = b !== "30-60";
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleTogglePendingBucket(b)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">
                          {b === "121 up" ? "121 วันขึ้นไป" : `${b} วัน`}
                        </span>
                        {isNonmove && (
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded-xs font-bold">
                            Non-Move
                          </span>
                        )}
                      </div>
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyBuckets}
                  className="h-8 text-xs font-semibold px-3.5 gap-1.5 w-full"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>ยืนยันการเลือก</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 3. SKU Type Multi-Check Popover */}
        <div className="relative" ref={typeRef}>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            ประเภทสินค้า (SKU Type)
          </label>
          <button
            type="button"
            onClick={() => {
              setPendingTypes(selectedSkuTypes);
              setIsTypeOpen(!isTypeOpen);
            }}
            className="w-full flex items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground hover:bg-muted/40 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Boxes className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-semibold truncate">{getTypeDisplayText()}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>

          {isTypeOpen && (
            <div className="absolute z-50 left-0 mt-1.5 w-64 rounded-lg border border-border bg-card p-3 shadow-xl space-y-2 animate-in fade-in-80 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground text-xs">เลือกประเภทสินค้า</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPendingTypes(["SELLABLE"])}
                    className="text-primary hover:underline font-medium"
                  >
                    เฉพาะ Sellable
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    onClick={() => setPendingTypes(Array.from(skuTypes))}
                    className="text-primary hover:underline font-medium"
                  >
                    ทั้งหมด
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {skuTypes.map((t) => {
                  const isChecked = pendingTypes.includes(t);
                  let labelTH = t;
                  if (t === "SELLABLE") labelTH = "สินค้าจำหน่าย (SELLABLE)";
                  else if (t === "DEMO") labelTH = "ตัวโชว์ (DEMO)";
                  else if (t === "MOCK_UP") labelTH = "สินค้าจำลอง (MOCK_UP)";
                  else if (t === "ONLINE") labelTH = "สินค้าออนไลน์ (ONLINE)";

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTogglePendingType(t)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-muted/60 transition-colors"
                    >
                      <span className="font-semibold text-foreground">{labelTH}</span>
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyTypes}
                  className="h-8 text-xs font-semibold px-3.5 gap-1.5 w-full"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>ยืนยันการเลือก</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

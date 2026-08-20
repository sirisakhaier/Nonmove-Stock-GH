"use client";

import React from "react";
import { formatCurrency, formatNumber } from "@/lib/validators";
import { Package, Layers, DollarSign, AlertTriangle } from "lucide-react";

interface KpiCardsProps {
  totalSkus: number;
  totalUnits: number;
  totalValue: number;
  highCount: number;
  highPct: number;
  okPct: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalSkus,
  totalUnits,
  totalValue,
  highCount,
  highPct,
  okPct,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total SKUs */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Non-Move Models</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalSkus)}</p>
          <p className="text-xs text-slate-500 mt-1">Distinct SKUs in store</p>
        </div>
        <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600">
          <Package className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Total Units */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Units</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalUnits)}</p>
          <p className="text-xs text-slate-500 mt-1">Total non-moving units</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
          <Layers className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Total Stock Value */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Value (THB)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-slate-500 mt-1">Total inventory valuation</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* 4. High Non-Move Ratio */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Non-Move Ratio</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-rose-600">{highPct}%</span>
            <span className="text-xs text-slate-500">({formatNumber(highCount)} models)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{okPct}% classified as OK</p>
        </div>
        <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, Store, Phone, User, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { validateThaiPhone } from "@/lib/validators";

export default function IdentifyPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if session cookie exists
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => {
        if (data.regions) setRegions(data.regions);
      })
      .catch((err) => console.error("Error loading regions:", err));
  }, []);

  // Fetch stores when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setStores([]);
      setSelectedStore("");
      return;
    }
    fetch(`/api/stores?region=${encodeURIComponent(selectedRegion)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stores) setStores(data.stores);
      })
      .catch((err) => console.error("Error loading stores:", err));
  }, [selectedRegion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedRegion) {
      setErrorMessage("Please select your Region.");
      return;
    }
    if (!selectedStore) {
      setErrorMessage("Please select your Store / Branch.");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your Name (at least 2 characters).");
      return;
    }
    if (!validateThaiPhone(phone)) {
      setErrorMessage("Please enter a valid 10-digit phone number (e.g. 0812345678).");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          branchCode: selectedStore,
          region: selectedRegion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to identify session");
      }

      router.push(`/dashboard/${selectedStore}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-sky-500/30 mb-3">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Non-Move Stock Analysis</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Store & Regional Inventory Performance Dashboard
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Region Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Select Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedStore("");
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                required
              >
                <option value="">-- Select Region --</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Store Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Select Store / Branch
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  disabled={!selectedRegion || stores.length === 0}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:opacity-60 transition"
                  required
                >
                  <option value="">
                    {!selectedRegion ? "Select region first" : "-- Select Store Branch --"}
                  </option>
                  {stores.map((s) => (
                    <option key={s.branchCode} value={s.branchCode}>
                      {s.branchCode} - {s.storeNameCust || s.storeName || s.province}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Staff Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 transition"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08XXXXXXXX"
                  maxLength={10}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 transition"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-sky-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? "Entering Dashboard..." : "Enter Store Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Store session logged for audit compliance</span>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  MapPin,
  User,
  Phone,
  ArrowRight,
  BarChart3,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { isValidThaiPhone } from "@/lib/validators";

export default function IdentifyPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<string[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => {
        setRegions(data.regions || []);
        setIsLoadingRegions(false);
      })
      .catch(() => setIsLoadingRegions(false));
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setStores([]);
      setSelectedBranch("");
      return;
    }

    setIsLoadingStores(true);
    fetch(`/api/stores?region=${encodeURIComponent(selectedRegion)}`)
      .then((res) => res.json())
      .then((data) => {
        setStores(data.stores || []);
        setIsLoadingStores(false);
      })
      .catch(() => setIsLoadingStores(false));
  }, [selectedRegion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegion) {
      setErrorMsg("กรุณาเลือกภูมิภาค");
      return;
    }
    if (!selectedBranch) {
      setErrorMsg("กรุณาเลือกสาขาของคุณ");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("กรุณาระบุชื่อ-นามสกุล");
      return;
    }
    if (!isValidThaiPhone(phone)) {
      setErrorMsg("กรุณาระบุเบอร์โทรศัพท์มือถือ 10 หลักที่ถูกต้อง (เช่น 0812345678)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const branchObj = stores.find((s) => s.branchCode === selectedBranch);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode: selectedBranch,
          userName: name.trim(),
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("บันทึกข้อมูลการเข้าสู่ระบบไม่สำเร็จ");
      }

      // Save store session in localStorage
      localStorage.setItem(
        "nonmove_user_session",
        JSON.stringify({
          branchCode: selectedBranch,
          branchName: branchObj?.storeNameCust || selectedBranch,
          userName: name.trim(),
          phone: phone.trim(),
          region: selectedRegion,
        })
      );

      router.push(`/dashboard/${selectedBranch}`);
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 text-white">
      {/* Header Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              Non-Move Stock Analysis
            </h1>
            <p className="text-xs text-slate-400">ระบบบริหารจัดการและวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว</p>
          </div>
        </div>

        {/* Quick Portal Switchers */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/viewer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            ภาพรวมผู้บริหาร (Viewer)
          </Link>
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 backdrop-blur hover:bg-amber-500/30 transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            ระบบอนุมัติ
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-300 border border-purple-500/30 backdrop-blur hover:bg-purple-500/30 transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            ผู้ดูแลระบบ (Admin)
          </Link>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-8">
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 p-8 shadow-2xl shadow-black/40">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              ระบบเข้าใช้งานสำหรับพนักงานสาขา
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              ระบุสาขาและตัวตน
            </h2>
            <p className="text-xs text-slate-300 mt-1.5">
              เลือกภูมิภาคและสาขาของคุณเพื่อเข้าสู่แดชบอร์ดรายงาน Non-Move
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-xl bg-rose-500/20 border border-rose-500/30 p-3.5 text-xs text-rose-200 flex gap-2.5 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Region Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. เลือกภูมิภาค (Region) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  disabled={isLoadingRegions}
                  className="w-full rounded-xl border border-white/20 bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-white shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">-- เลือกภูมิภาค / ภาค --</option>
                  {regions.map((reg) => (
                    <option key={reg} value={reg} className="bg-slate-800 text-white">
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Store Branch Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. เลือกรหัสสาขา / ร้านค้า <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!selectedRegion || isLoadingStores}
                  className="w-full rounded-xl border border-white/20 bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-white shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingStores ? "กำลังโหลดรายชื่อสาขา..." : "-- เลือกรหัสสาขา --"}
                  </option>
                  {stores.map((s) => (
                    <option key={s.branchCode} value={s.branchCode} className="bg-slate-800 text-white">
                      {s.branchCode} - {s.storeNameCust}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                3. ชื่อผู้เข้าใช้งาน <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full rounded-xl border border-white/20 bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4. เบอร์โทรศัพท์มือถือ (10 หลัก) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="08XXXXXXXX"
                  className="w-full rounded-xl border border-white/20 bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/40 hover:bg-blue-500 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่แดชบอร์ดสาขา
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick links on mobile */}
          <div className="mt-6 pt-5 border-t border-white/10 sm:hidden flex flex-col gap-2">
            <Link
              href="/viewer"
              className="text-center py-2 text-xs font-semibold text-indigo-300 bg-white/5 rounded-xl"
            >
              📊 ภาพรวมผู้บริหาร (Viewer)
            </Link>
            <Link
              href="/approvals"
              className="text-center py-2 text-xs font-semibold text-amber-300 bg-white/5 rounded-xl"
            >
              ✅ ระบบอนุมัติคำขอ (Approvals)
            </Link>
            <Link
              href="/admin"
              className="text-center py-2 text-xs font-semibold text-purple-300 bg-white/5 rounded-xl"
            >
              ⚙️ จัดการระบบ (Admin)
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-slate-500">
        ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 Non-Move Stock App. All rights reserved.
      </div>
    </div>
  );
}

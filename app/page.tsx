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
  Layers,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  Loader2,
  GitCommit,
  Lock,
  X,
  ChevronRight,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isValidThaiPhone } from "@/lib/validators";
import { APP_VERSION, TEAM_NAME, getCommitHash } from "@/lib/version";

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
  const [commitHash, setCommitHash] = useState(getCommitHash());

  // Merged Admin & Viewer Modal State
  const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => {
        setRegions(data.regions || []);
        setIsLoadingRegions(false);
      })
      .catch(() => setIsLoadingRegions(false));

    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        if (data.commit) setCommitHash(data.commit);
      })
      .catch(() => {});
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
          name: name.trim(),
          userName: name.trim(),
          phone: phone.trim(),
          region: selectedRegion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกข้อมูลการเข้าสู่ระบบไม่สำเร็จ");
      }

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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setAdminError("กรุณากรอกรหัสผ่าน Admin");
      return;
    }
    setIsAdminVerifying(true);
    setAdminError("");

    // Check passcode (standard default admin123 or check via session/api)
    if (adminPasscode === "admin123") {
      localStorage.setItem("approver_passcode", adminPasscode);
      setIsMgmtModalOpen(false);
      router.push("/admin");
    } else {
      setAdminError("รหัสผ่าน Admin ไม่ถูกต้อง");
      setIsAdminVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white transition-colors duration-200">
      {/* 1. Top Header: Highlighted Logo, Title & Merged Management Button */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        {/* Highlighted Haier Logo & App Title */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Haier"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
                Non-Move Stock Analysis
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
                HAIER
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-blue-200/80 mt-0.5">
              {TEAM_NAME}
            </p>
          </div>
        </div>

        {/* Action Controls: Merged 1 Button (Admin & Viewer) + ThemeToggle */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Merged 1 Button for Admin & Viewer */}
          <button
            type="button"
            onClick={() => {
              setAdminError("");
              setAdminPasscode("");
              setIsMgmtModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>เข้าสู่ระบบผู้บริหาร / จัดการระบบ</span>
          </button>

          <ThemeToggle className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm" />
        </div>
      </div>

      {/* 2. Main Login Card (Store Identification) */}
      <div className="max-w-md mx-auto w-full my-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/70 transition-all">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-400/30 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              ระบบเข้าใช้งานสำหรับพนักงานสาขา
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ระบุสาขาและตัวตน
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              เลือกภูมิภาคและสาขาของคุณเพื่อเข้าสู่แดชบอร์ดรายงาน Non-Move
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 p-3.5 text-xs text-rose-700 dark:text-rose-200 flex gap-2.5 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Region Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                1. เลือกภูมิภาค (Region) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  disabled={isLoadingRegions}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white shadow-sm focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- เลือกภูมิภาค / ภาค --</option>
                  {regions.map((reg) => (
                    <option key={reg} value={reg} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Store Branch Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                2. เลือกรหัสสาขา / ร้านค้า <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!selectedRegion || isLoadingStores}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white shadow-sm focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingStores ? "กำลังโหลดรายชื่อสาขา..." : "-- เลือกรหัสสาขา --"}
                  </option>
                  {stores.map((s) => (
                    <option key={s.branchCode} value={s.branchCode} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {s.branchCode} - {s.storeNameCust}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. User Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                3. ชื่อผู้เข้าใช้งาน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* 4. Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                4. เบอร์โทรศัพท์มือถือ (10 หลัก) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="08XXXXXXXX"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 shadow-sm focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all disabled:opacity-50"
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
        </div>
      </div>

      {/* 3. Footer with Team Name & GitHub Commit Version */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-3 space-y-1">
        <div>
          ระบบวิเคราะห์สต๊อกสินค้าไม่เคลื่อนไหว &copy; 2026 <strong>{TEAM_NAME}</strong>
        </div>
        <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
          <GitCommit className="h-3.5 w-3.5 text-indigo-500" />
          <span>Version: {APP_VERSION} (Commit: <strong className="text-slate-700 dark:text-slate-300">{commitHash}</strong>)</span>
        </div>
      </div>

      {/* 4. Unified Modal for Admin & Viewer Login */}
      {isMgmtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setIsMgmtModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 mb-2">
                <ShieldAlert className="h-3.5 w-3.5" />
                ศูนย์กลางผู้บริหารและจัดการระบบ
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                เลือกโหมดการเข้าใช้งาน
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                กรุณาเลือกประเภทผู้ใช้งานที่ต้องการเข้าถึง
              </p>
            </div>

            {/* Option 1: Executive Viewer Mode */}
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      ภาพรวมผู้บริหาร (Executive Viewer)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ดูภาพรวมสต๊อกทั่วประเทศ, ทุกสาขา และ Top 100 SKUs
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/viewer"
                onClick={() => setIsMgmtModalOpen(false)}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-colors"
              >
                เข้าสู่ภาพรวมผู้บริหาร (Viewer)
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">หรือ</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Option 2: System Admin Console (Passcode Protected) */}
            <div className="rounded-2xl border border-purple-100 dark:border-purple-950 bg-purple-50/50 dark:bg-purple-950/30 p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    จัดการระบบ (System Admin)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    อัปโหลดข้อมูล, จัดการสาขา/Model, และตรวจสอบคำขอ
                  </p>
                </div>
              </div>

              {adminError && (
                <div className="rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                  {adminError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-2.5">
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="กรอกรหัสผ่าน Admin..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isAdminVerifying}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  {isAdminVerifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  ยืนยันเข้าสู่ระบบ Admin
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

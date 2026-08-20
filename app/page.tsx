"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  KeyRound,
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

  // Merged Management Modal (Admin & Viewer)
  const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
  const [mgmtTab, setMgmtTab] = useState<"VIEWER" | "ADMIN">("VIEWER");
  const [viewerPasscode, setViewerPasscode] = useState("");
  const [viewerError, setViewerError] = useState("");
  const [isViewerVerifying, setIsViewerVerifying] = useState(false);

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

  const handleViewerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerPasscode.trim()) {
      setViewerError("กรุณากรอกรหัสผ่าน");
      return;
    }
    setIsViewerVerifying(true);
    setViewerError("");

    if (viewerPasscode === "viewer1234") {
      localStorage.setItem("viewer_passcode", viewerPasscode);
      setIsMgmtModalOpen(false);
      router.push("/viewer");
    } else {
      setViewerError("รหัสผ่านไม่ถูกต้อง");
      setIsViewerVerifying(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) {
      setAdminError("กรุณากรอกรหัสผ่าน");
      return;
    }
    setIsAdminVerifying(true);
    setAdminError("");

    if (adminPasscode === "admin1234" || adminPasscode === "admin123") {
      localStorage.setItem("approver_passcode", adminPasscode);
      setIsMgmtModalOpen(false);
      router.push("/admin");
    } else {
      setAdminError("รหัสผ่านไม่ถูกต้อง");
      setIsAdminVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8 text-slate-900 dark:text-white transition-colors duration-200">
      {/* 1. Top Header: Scaled Logo, Title, Global House Store Brand & Compact Viewer/Admin Button */}
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        {/* Scaled Logo, Title & Global House Store Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logo.png"
            alt="Haier"
            className="h-12 sm:h-16 w-auto object-contain shrink-0 drop-shadow-sm"
          />
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
              Non-Move Stock Analysis
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {TEAM_NAME}
            </p>

            {/* Store Partner: Global House */}
            <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-800">
              <img
                src="/global_house.jpg"
                alt="Global House"
                className="h-4 sm:h-5 w-auto object-contain rounded"
              />
              <span className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-400">
                โกลบอลเฮ้าส์ (Global House)
              </span>
            </div>
          </div>
        </div>

        {/* Compact Viewer/Admin Button & Mode Switch */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setViewerError("");
              setViewerPasscode("");
              setAdminError("");
              setAdminPasscode("");
              setIsMgmtModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Viewer/Admin</span>
          </button>

          <ThemeToggle className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm" />
        </div>
      </div>

      {/* 2. Main Login Card (Store Identification) */}
      <div className="max-w-md mx-auto w-full my-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/70 transition-all">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ระบุสาขาและตัวตน
            </h2>
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

      {/* 4. Unified Passcode Modal for Admin & Viewer Login */}
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
                <KeyRound className="h-3.5 w-3.5" />
                เข้าสู่ระบบผู้บริหาร / จัดการระบบ
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                กรุณาระบุรหัสผ่านเพื่อเข้าใช้งาน
              </h3>
            </div>

            {/* Tabs: Viewer vs Admin */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMgmtTab("VIEWER");
                  setViewerError("");
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mgmtTab === "VIEWER"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                ภาพรวมผู้บริหาร (Viewer)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMgmtTab("ADMIN");
                  setAdminError("");
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mgmtTab === "ADMIN"
                    ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                จัดการระบบ (Admin)
              </button>
            </div>

            {/* Tab 1: Viewer Login */}
            {mgmtTab === "VIEWER" && (
              <form onSubmit={handleViewerLogin} className="space-y-3 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  สำหรับผู้บริหารและทีมงานส่วนกลาง เข้าดูภาพรวมสต๊อกทั่วประเทศ
                </div>

                {viewerError && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{viewerError}</span>
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={viewerPasscode}
                    onChange={(e) => setViewerPasscode(e.target.value)}
                    placeholder="กรอกรหัสผ่าน..."
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isViewerVerifying}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold shadow-sm transition-colors"
                >
                  {isViewerVerifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Layers className="h-3.5 w-3.5" />
                  )}
                  เข้าสู่ภาพรวมผู้บริหาร (Viewer)
                </button>
              </form>
            )}

            {/* Tab 2: Admin Login */}
            {mgmtTab === "ADMIN" && (
              <form onSubmit={handleAdminLogin} className="space-y-3 pt-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  สำหรับผู้ดูแลระบบ อัปโหลดรายงาน จัดการข้อมูลสาขาและพิจารณาคำขอ
                </div>

                {adminError && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="กรอกรหัสผ่าน..."
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAdminVerifying}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2.5 text-xs font-bold shadow-sm transition-colors"
                >
                  {isAdminVerifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  เข้าสู่ระบบจัดการ (Admin)
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

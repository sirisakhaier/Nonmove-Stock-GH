"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  MapPin,
  User,
  Phone,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Lock,
  X,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Separate Modals for Viewer and Admin
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewerPasscode, setViewerPasscode] = useState("");
  const [viewerError, setViewerError] = useState("");
  const [isViewerVerifying, setIsViewerVerifying] = useState(false);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
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
      setIsViewerModalOpen(false);
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
      setIsAdminModalOpen(false);
      router.push("/admin");
    } else {
      setAdminError("รหัสผ่านไม่ถูกต้อง");
      setIsAdminVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors">
      {/* 1. Header Bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex flex-col items-start text-left space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Non-Move Stock Management
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <img
                src="/global_house.jpg"
                alt="Global House"
                className="h-5 w-auto object-contain rounded-xs"
              />
              <span>Global House (โกลบอลเฮ้าส์)</span>
            </div>

            <span className="hidden sm:inline-block text-border">·</span>

            <div className="flex items-center gap-1.5">
              <img
                src="/logo.png"
                alt="Haier"
                className="h-5 w-auto object-contain"
              />
              <span>Sell out team, Haier (Thailand)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* 2. Main Input Zone: Store Login Card */}
      <main className="max-w-md mx-auto w-full my-6 space-y-4">
        <Card className="border-border shadow-xs">
          <CardHeader className="text-center space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">เข้าสู่ระบบสำหรับสาขา</CardTitle>
            <CardDescription>
              เลือกภูมิภาคและสาขาของคุณเพื่อจัดการสต๊อกสินค้าไม่เคลื่อนไหว
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="mb-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-300 flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Region Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>ภูมิภาค (Region) <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  disabled={isLoadingRegions}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-slate-950 dark:focus:ring-slate-300"
                >
                  <option value="">-- กรุณาเลือกภูมิภาค --</option>
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>
                      ภาค {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Store Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>สาขา (Branch) <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!selectedRegion || isLoadingStores}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-slate-950 dark:focus:ring-slate-300 disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingStores ? "กำลังโหลดรายชื่อสาขา..." : "-- กรุณาเลือกสาขา --"}
                  </option>
                  {stores.map((s) => (
                    <option key={s.branchCode} value={s.branchCode}>
                      {s.branchCode} - {s.storeNameCust || s.storeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>ชื่อ-นามสกุล ผู้ใช้งาน <span className="text-rose-500">*</span></span>
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี (PC โกลบอลเฮ้าส์)"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span></span>
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0XXXXXXXXX (10 หลัก)"
                  maxLength={10}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !selectedRegion || !selectedBranch}
                className="w-full mt-2 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <span>เข้าสู่หน้ารายการสต๊อก</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 3. BELOW INPUT ZONE: Separate Links for Executive Viewer & Admin */}
        <div className="space-y-3 pt-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              หรือเข้าสู่ระบบฝ่ายบริหารและจัดการ
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Separate Link/Button for Viewer */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setViewerError("");
                setViewerPasscode("");
                setIsViewerModalOpen(true);
              }}
              className="h-auto py-3 px-3.5 flex flex-col items-start gap-1 bg-card hover:bg-muted/60 border-border text-left group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Executive Viewer</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">
                ภาพรวมวิเคราะห์ &amp; RAW Data
              </span>
            </Button>

            {/* Separate Link/Button for Admin */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAdminError("");
                setAdminPasscode("");
                setIsAdminModalOpen(true);
              }}
              className="h-auto py-3 px-3.5 flex flex-col items-start gap-1 bg-card hover:bg-muted/60 border-border text-left group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span>Admin Hub</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">
                จัดการ Master &amp; อนุมัติคำขอ
              </span>
            </Button>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>
          <span>Non-Move Stock Analysis System</span> · <span>v{APP_VERSION}</span>
        </div>
        <div>
          <span>{commitHash ? `Commit: ${commitHash}` : TEAM_NAME}</span>
        </div>
      </footer>

      {/* 5. Separate Modal for Executive Viewer */}
      {isViewerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card text-card-foreground shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  เข้าสู่ระบบ Executive Viewer
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsViewerModalOpen(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4">
              <form onSubmit={handleViewerLogin} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  สำหรับผู้บริหาร ดูภาพรวมวิเคราะห์รายวัน แนวโน้ม และดาวน์โหลด RAW Data
                </p>

                {viewerError && (
                  <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                    {viewerError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    รหัสผ่าน Viewer (viewer1234)
                  </label>
                  <Input
                    type="password"
                    value={viewerPasscode}
                    onChange={(e) => setViewerPasscode(e.target.value)}
                    placeholder="กรอกรหัสผ่าน Viewer"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isViewerVerifying}
                  className="w-full mt-2 font-medium"
                >
                  {isViewerVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    "เข้าสู่ระบบ Viewer"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. Separate Modal for Admin Management Hub */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card text-card-foreground shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  เข้าสู่ระบบ Admin Hub
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAdminModalOpen(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4">
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  สำหรับผู้ดูแลระบบ จัดการมิติข้อมูล Store/Model นำเข้ารายงาน และพิจารณาคำขอ
                </p>

                {adminError && (
                  <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                    {adminError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    รหัสผ่าน Admin (admin1234)
                  </label>
                  <Input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="กรอกรหัสผ่าน Admin"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isAdminVerifying}
                  className="w-full mt-2 font-medium"
                >
                  {isAdminVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    "เข้าสู่ระบบ Admin Hub"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

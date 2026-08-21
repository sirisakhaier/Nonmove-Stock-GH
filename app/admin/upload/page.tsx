"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Upload, FileSpreadsheet, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [passcode, setPasscode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("กรุณาเลือกไฟล์ Excel (.xlsx, .xls)");
      return;
    }
    if (!passcode) {
      setErrorMessage("กรุณากรอกรหัสผ่าน Admin");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setResultMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("passcode", passcode);

    try {
      const res = await fetch("/api/admin/etl", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "นำเข้าข้อมูลไม่สำเร็จ");
      }

      setResultMessage(data.message || "นำเข้าไฟล์รายงานเรียบร้อยแล้ว!");
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />

      <main className="max-w-xl w-full mx-auto px-4 py-10 space-y-6 flex-1">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-6 pb-3 text-center border-b border-border">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-2">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold">
              อัปโหลดไฟล์รายงาน Non-Move Stock
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              นำเข้าไฟล์ Excel ข้อมูลสินค้าไม่เคลื่อนไหวเข้าสู่ฐานข้อมูลระบบ
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File input */}
              <div className="border border-dashed border-input rounded-lg p-6 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx, .xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer block space-y-2">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <div className="text-xs font-medium text-foreground">
                    {file ? file.name : "คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls)"}
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    ขนาดไฟล์ไม่เกิน 50MB
                  </span>
                </label>
              </div>

              {/* Passcode input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">รหัสผ่าน Admin</label>
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่าน Admin..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="text-xs"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {resultMessage && (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{resultMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading}
                className="w-full font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังประมวลผล...
                  </>
                ) : (
                  "เริ่มนำเข้าข้อมูล"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        Non-Move Stock Management &copy; 2026
      </footer>
    </div>
  );
}

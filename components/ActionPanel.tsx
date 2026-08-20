"use client";

import React, { useState } from "react";
import { X, Upload, FileText, ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { formatCurrency } from "@/lib/validators";

interface ActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    productCode: string;
    productName: string;
    model: string;
    categoryName: string;
    subCategory: string;
    nonmoveDaysBucket: string;
    agingDaysBucket: string;
    stockQty: number;
    stockValue: number;
    activeRequest?: any;
  } | null;
  branchCode: string;
  onSuccess: () => void;
}

export function ActionPanel({
  isOpen,
  onClose,
  product,
  branchCode,
  onSuccess,
}: ActionPanelProps) {
  const [activeTab, setActiveTab] = useState<"EXPLAIN" | "EXCLUDE">("EXPLAIN");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  if (!isOpen || !product) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("กรุณาระบุเหตุผล");
      return;
    }

    if (activeTab === "EXCLUDE" && photos.length === 0) {
      setErrorMsg("การขอปลดล็อค/ยกเว้น จำเป็นต้องแนบรูปถ่ายหลักฐานอย่างน้อย 1 รูป");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);
        const upRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          photoUrls.push(upData.url);
        }
      }

      // 2. Submit request
      const payload = {
        branchCode,
        productCode: product.productCode,
        requestType: activeTab,
        reason,
        comments,
        photos: photoUrls,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetReasons = activeTab === "EXPLAIN" ? [
    "สินค้าตัวโชว์หน้าร้าน (Display / Mock-up)",
    "รอลูกค้ารับสินค้า / รอส่งมอบ",
    "สินค้าชำรุดรอส่งเคลมศูนย์บริการ",
    "สินค้าจัดโปรโมชั่น / รอแคมเปญ",
    "ลูกค้าสอบถามต่อเนื่องแต่ยังไม่ปิดการขาย",
    "อื่นๆ (ระบุในคำอธิบายเพิ่มเติม)",
  ] : [
    "สินค้าตัวโชว์หน้าร้าน (Display Mock-up) - มีรูปป้ายและสินค้า",
    "สินค้าติดจองมัดจำแล้ว - มีใบเสร็จรับเงิน/มัดจำ",
    "สินค้าชำรุดส่งเคลม - มีเอกสารส่งเคลม",
    "ข้อผิดพลาดทางระบบสต๊อก / รอปรับยอด",
    "อื่นๆ (ต้องมีหลักฐานชัดเจน)",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                บันทึกข้อมูลสินค้า / การดำเนินการ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รหัสสินค้า: {product.productCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Product Summary Mini Card */}
          <div className="bg-blue-50/70 border-b border-blue-100 p-4">
            <div className="text-sm font-semibold text-slate-900 line-clamp-2">
              {product.productName}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200">
                รุ่น: {product.model}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200">
                ช่วงวัน: {product.nonmoveDaysBucket} วัน
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-semibold text-blue-700">
                สต๊อก: {product.stockQty} ชิ้น ({formatCurrency(product.stockValue)})
              </span>
            </div>
            {product.activeRequest && (
              <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">สถานะปัจจุบัน:</span>
                <RequestStatusBadge
                  status={product.activeRequest.status}
                  requestType={product.activeRequest.requestType}
                />
              </div>
            )}
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveTab("EXPLAIN"); setErrorMsg(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "EXPLAIN"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              1. ชี้แจงเหตุผล (Explain)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("EXCLUDE"); setErrorMsg(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "EXCLUDE"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              2. ขอปลดล็อค/ยกเว้น (Exclusion)
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === "EXCLUDE" && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">เงื่อนไขการขอยกเว้น (Exclusion)</span>
                  คำขอนี้จะถูกส่งไปยังผู้จัดการภาค/สำนักงานใหญ่เพื่อตรวจสอบ และจำเป็นต้องมีรูปถ่ายหลักฐานประกอบ
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Reason Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เหตุผลหลัก <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- เลือกเหตุผล --</option>
                {presetReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed Comments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบาย / รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติม หรือแผนการระบายสต๊อก..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Photo Attachments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รูปถ่ายหลักฐาน {activeTab === "EXCLUDE" ? <span className="text-rose-500">* (จำเป็น)</span> : "(ถ้ามี)"}
              </label>

              <div className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-7 w-7 text-slate-400" />
                  <div className="mt-1 text-xs text-slate-600">
                    <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 hover:text-blue-500">
                      <span>คลิกเพื่ออัปโหลดรูปภาพ</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, JPEG ไม่เกิน 10MB</p>
                </div>
              </div>

              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photoPreviews.map((src, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square">
                      <img src={src} alt="preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 rounded-full bg-slate-900/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {activeTab === "EXPLAIN" ? "บันทึกคำชี้แจง" : "ส่งคำขอยกเว้น"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

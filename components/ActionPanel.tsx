"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, ShieldAlert, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (product?.activeRequest) {
      setReason(product.activeRequest.reason || "");
      setComments(product.activeRequest.comments || "");
      if (product.activeRequest.photos && Array.isArray(product.activeRequest.photos)) {
        setExistingPhotos(product.activeRequest.photos.map((p: any) => p.url || p.photoUrl));
      }
    } else {
      setReason("");
      setComments("");
      setExistingPhotos([]);
    }
    setPhotos([]);
    setPhotoPreviews([]);
    setErrorMsg("");
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const isNeedsRevision = product.activeRequest?.status === "REVISE";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewPhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("กรุณาเลือกหรือระบุเหตุผลการขอยกเว้น");
      return;
    }

    const totalPhotoCount = existingPhotos.length + photos.length;
    if (totalPhotoCount === 0) {
      setErrorMsg("การขอยกเว้นจำเป็นต้องแนบรูปถ่ายหลักฐานอย่างน้อย 1 รูป (เช่น รูปสินค้าหน้าร้าน, ป้ายราคา, หรือเอกสาร)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Upload new photos
      const newPhotoUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);
        const upRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          newPhotoUrls.push(upData.url);
        }
      }

      const allPhotoUrls = [...existingPhotos, ...newPhotoUrls];

      // 2. Submit or Re-submit
      if (isNeedsRevision && product.activeRequest?.id) {
        const res = await fetch(`/api/requests/${product.activeRequest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isResubmission: true,
            status: "PENDING",
            requestType: "EXCLUDE",
            reason,
            comments,
            photoUrls: newPhotoUrls,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
        }
      } else {
        const payload = {
          branchCode,
          productCode: product.productCode,
          requestType: "EXCLUDE",
          reason,
          comments,
          photoUrls: allPhotoUrls,
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
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetReasons = [
    "สินค้าตัวโชว์หน้าร้าน (Display / Mock-up)",
    "สินค้าติดจองมัดจำแล้ว / รอลูกค้ารับมอบ",
    "สินค้าชำรุดรอส่งเคลมศูนย์บริการ",
    "สินค้าจัดโปรโมชั่น / รอแคมเปญส่งเสริมการขาย",
    "สินค้าค้างสต๊อกรอย้ายสาขา / ส่งคืนคลังหลัก",
    "ข้อผิดพลาดทางระบบสต๊อก / รอปรับยอดบัญชี",
    "อื่นๆ (ระบุในคำอธิบายเพิ่มเติม)",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isNeedsRevision ? "แก้ไขและยื่นคำขอยกเว้นใหม่" : "ยื่นคำขอยกเว้นการคิด Non-Move"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  รหัสสินค้า: {product.productCode}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Product Summary Mini Card */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 p-4 space-y-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
              {product.productName}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 font-mono">
                รุ่น: {product.model}
              </span>
              <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                หมวด: {product.categoryName}
              </span>
              <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 font-semibold text-indigo-700 dark:text-indigo-400">
                คงเหลือ: {product.stockQty} ชิ้น ({formatCurrency(product.stockValue)})
              </span>
            </div>

            {product.activeRequest && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">สถานะปัจจุบัน:</span>
                <RequestStatusBadge
                  status={product.activeRequest.status}
                  requestType="EXCLUDE"
                />
              </div>
            )}

            {/* Note from Approver if REVISE */}
            {isNeedsRevision && product.activeRequest?.reviewComment && (
              <div className="mt-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4" />
                  ข้อความจากผู้อนุมัติ (สิ่งที่ต้องการให้แก้ไข/แนบเพิ่ม):
                </div>
                <p className="text-slate-800 dark:text-slate-200 pl-5 font-medium">
                  &ldquo;{product.activeRequest.reviewComment}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex gap-2.5 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Reason Select */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                1. เหตุผลการขอยกเว้น <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  -- กรุณาเลือกเหตุผล --
                </option>
                {presetReasons.map((r) => (
                  <option key={r} value={r} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Description / Action Plan */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                2. คำอธิบายเพิ่มเติม / แผนการดำเนินการ
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="ระบุรายละเอียดประกอบ เช่น วันที่คาดว่าจะส่งมอบ หรือแผนการระบายสินค้า..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* 3. Photo Proofs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  3. รูปถ่ายหลักฐานประกอบ <span className="text-rose-500">* (จำเป็นอย่างน้อย 1 รูป)</span>
                </label>
                <span className="text-[11px] text-slate-400">รวม {existingPhotos.length + photos.length} รูป</span>
              </div>

              {/* Upload Drop Zone */}
              <div className="flex justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-4 py-4 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-slate-400" />
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    <label className="cursor-pointer rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                      <span>คลิกเพื่อถ่ายหรือเลือกรูปภาพ</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">รองรับ PNG, JPG, JPEG (อัปโหลดได้หลายรูป)</p>
                </div>
              </div>

              {/* Photos Gallery */}
              {(existingPhotos.length > 0 || photoPreviews.length > 0) && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {existingPhotos.map((src, idx) => (
                    <div key={`existing-${idx}`} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square group shadow-sm">
                      <img src={src} alt="existing-proof" className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-[9px] text-white text-center py-0.5">
                        รูปเดิม
                      </span>
                    </div>
                  ))}
                  {photoPreviews.map((src, idx) => (
                    <div key={`new-${idx}`} className="relative rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-700 aspect-square group shadow-sm">
                      <img src={src} alt="new-proof" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(idx)}
                        className="absolute top-1 right-1 rounded-full bg-rose-600 p-1 text-white shadow-sm hover:bg-rose-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-0 inset-x-0 bg-indigo-600/80 text-[9px] text-white text-center py-0.5">
                        รูปใหม่
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {isNeedsRevision ? "ยื่นขอพิจารณาใหม่ (Resubmit)" : "ส่งคำขอยกเว้น"}
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

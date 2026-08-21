"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
        const upData = await upRes.json();
        if (!upRes.ok) {
          throw new Error(upData.error || "อัปโหลดรูปภาพไม่สำเร็จ");
        }
        newPhotoUrls.push(upData.url);
      }

      const allPhotoUrls = [...existingPhotos, ...newPhotoUrls];

      // 2. Submit request
      const sessionStr = localStorage.getItem("nonmove_user_session");
      const sessionObj = sessionStr ? JSON.parse(sessionStr) : null;

      const bodyData = {
        branchCode,
        productCode: product.productCode,
        requestType: "EXCLUDE",
        reason,
        comments,
        photos: allPhotoUrls,
        userName: sessionObj?.userName || "User Store",
        phone: sessionObj?.phone || "-",
      };

      let res;
      if (product.activeRequest && isNeedsRevision) {
        res = await fetch(`/api/requests/${product.activeRequest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...bodyData,
            status: "PENDING",
          }),
        });
      } else {
        res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกคำขอไม่สำเร็จ");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการบันทึกคำขอ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-xl border-border animate-in fade-in zoom-in-95 duration-150 my-8">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-bold">
              {isNeedsRevision ? "แก้ไขข้อมูลคำขอ (ส่งข้อมูลเพิ่มเติม)" : "ยื่นคำขอยกเว้นสินค้า (Request Exclusion)"}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              รุ่นสินค้า: {product.model} ({product.productCode})
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4 text-xs">
          {/* Product Summary Box */}
          <div className="bg-muted/40 p-3 rounded-md border border-border space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">{product.model}</span>
              <Badge variant="outline" className="text-[10px]">
                {product.nonmoveDaysBucket} วัน
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>หมวดหมู่: {product.categoryName}</span>
              <span>สต๊อก: {product.stockQty} ชิ้น ({formatCurrency(product.stockValue)})</span>
            </div>
          </div>

          {/* Admin Revision Feedback Callout if revision required */}
          {isNeedsRevision && product.activeRequest?.reviewComment && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-semibold block">ข้อความแจ้งจากผู้อนุมัติ:</span>
              <p>{product.activeRequest.reviewComment}</p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Reason Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                เหตุผลการขอยกเว้น <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden"
                required
              >
                <option value="">-- กรุณาเลือกเหตุผล --</option>
                <option value="สินค้าตัวโชว์หน้าร้าน (Display / Demo Unit)">สินค้าตัวโชว์หน้าร้าน (Display / Demo Unit)</option>
                <option value="สินค้าชำรุด / รอส่งเคลม (Defective / RMA)">สินค้าชำรุด / รอส่งเคลม (Defective / RMA)</option>
                <option value="สต๊อกไม่ตรงกับระบบ / รอดำเนินการปรับยอด (Stock Discrepancy)">สต๊อกไม่ตรงกับระบบ / รอดำเนินการปรับยอด (Stock Discrepancy)</option>
                <option value="สินค้าติดจองลูกค้ารอส่งมอบ (Reserved for Delivery)">สินค้าติดจองลูกค้ารอส่งมอบ (Reserved for Delivery)</option>
                <option value="อื่นๆ (ระบุในรายละเอียด)">อื่นๆ (ระบุในรายละเอียดเพิ่มเติม)</option>
              </select>
            </div>

            {/* Additional Comments */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                คำอธิบายเพิ่มเติม
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติมเพื่อประกอบการพิจารณา..."
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-hidden"
              />
            </div>

            {/* Photo Upload with Previews */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  รูปถ่ายหลักฐาน <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  (อย่างน้อย 1 รูป)
                </span>
              </div>

              {/* Photos Gallery Preview */}
              {(existingPhotos.length > 0 || photoPreviews.length > 0) && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {existingPhotos.map((url, idx) => (
                    <div key={`exist-${idx}`} className="aspect-square rounded-md border border-border overflow-hidden relative group">
                      <img src={url} alt="Existing" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {photoPreviews.map((url, idx) => (
                    <div key={`new-${idx}`} className="aspect-square rounded-md border border-border overflow-hidden relative group">
                      <img src={url} alt="New preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Input */}
              <div className="border border-dashed border-input rounded-md p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                <input
                  type="file"
                  id="actionPhotoInput"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label htmlFor="actionPhotoInput" className="cursor-pointer flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">คลิกเพื่อแนบรูปถ่ายหลักฐาน</span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "ส่งคำขอยกเว้น"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

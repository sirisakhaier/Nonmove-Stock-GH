"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Calendar,
  User,
  HelpCircle,
  Clock,
} from "lucide-react";
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

export const REASON_OPTIONS = [
  { id: "DISPLAY", label: "สินค้าตัวโชว์หน้าร้าน" },
  { id: "DEFECTIVE", label: "สินค้าชำรุด / รอส่งเคลม RTB" },
  { id: "DISCREPANCY", label: "สต๊อกไม่ตรงกับระบบ / หาของไม่พบ" },
  { id: "RESERVED", label: "สินค้าติดจองลูกค้ารอส่งมอบ" },
  { id: "OTHER", label: "อื่นๆ (ระบุรายละเอียดเพิ่มเติม)" },
];

export function ActionPanel({
  isOpen,
  onClose,
  product,
  branchCode,
  onSuccess,
}: ActionPanelProps) {
  const [reasonType, setReasonType] = useState<string>("");

  // 1. เฉพาะสินค้าตัวโชว์
  const [displayReason, setDisplayReason] = useState("");
  const [displayRemoveDate, setDisplayRemoveDate] = useState("");

  // 2. เฉพาะสินค้าชำรุด / เคลม RTB
  const [hasDefectiveRequest, setHasDefectiveRequest] = useState("เปิดคำขอแจ้งชำรุดแล้ว");
  const [defectiveTicket, setDefectiveTicket] = useState("");
  const [defectiveDeliveryDate, setDefectiveDeliveryDate] = useState("");

  // 3. เฉพาะสต๊อกไม่ตรงกับระบบ
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [confirmedBy, setConfirmedBy] = useState("");

  // 4. เฉพาะสินค้าติดจองลูกค้ารอส่งมอบ
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // หมายเหตุเพิ่มเติม
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (product?.activeRequest) {
      const activeReason = product.activeRequest.reason || "";
      if (activeReason.includes("Display") || activeReason.includes("โชว์")) {
        setReasonType("DISPLAY");
      } else if (activeReason.includes("Defective") || activeReason.includes("RTB") || activeReason.includes("RMA") || activeReason.includes("ชำรุด")) {
        setReasonType("DEFECTIVE");
      } else if (activeReason.includes("Discrepancy") || activeReason.includes("ไม่ตรง") || activeReason.includes("หาของไม่พบ")) {
        setReasonType("DISCREPANCY");
      } else if (activeReason.includes("Reserved") || activeReason.includes("ติดจอง")) {
        setReasonType("RESERVED");
      } else {
        setReasonType("OTHER");
      }

      setAdditionalNotes(product.activeRequest.comments || "");
      if (product.activeRequest.photos && Array.isArray(product.activeRequest.photos)) {
        setExistingPhotos(product.activeRequest.photos.map((p: any) => p.url || p.photoUrl));
      }
    } else {
      setReasonType("");
      setDisplayReason("");
      setDisplayRemoveDate("");
      setHasDefectiveRequest("เปิดคำขอแจ้งชำรุดแล้ว");
      setDefectiveTicket("");
      setDefectiveDeliveryDate("");
      setDiscrepancyReason("");
      setConfirmedBy("");
      setCustomerName("");
      setBookingDate("");
      setDeliveryDate("");
      setAdditionalNotes("");
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
    if (!reasonType) {
      setErrorMsg("กรุณาเลือกเหตุผลการขอยกเว้น");
      return;
    }

    let reasonText = "";
    let structuredComments = "";

    if (reasonType === "DISPLAY") {
      if (!displayReason.trim()) {
        setErrorMsg("กรุณาระบุเหตุผลที่นำสินค้ารุ่นนี้มาจัดแสดงตัวโชว์");
        return;
      }
      if (!displayRemoveDate) {
        setErrorMsg("กรุณาระบุกำหนดการนำตัวโชว์ออก / วันที่ถอดโชว์");
        return;
      }
      reasonText = "สินค้าตัวโชว์หน้าร้าน";
      structuredComments = `[ข้อมูลสินค้าตัวโชว์]\n• เหตุผลที่ใช้เป็นตัวโชว์: ${displayReason.trim()}\n• กำหนดการถอดตัวโชว์: ${displayRemoveDate}`;
    } else if (reasonType === "DEFECTIVE") {
      if (!defectiveDeliveryDate) {
        setErrorMsg("กรุณาระบุกำหนดการส่งสินค้าชำรุดออกจากสาขา");
        return;
      }
      reasonText = "สินค้าชำรุด / รอส่งเคลม RTB";
      structuredComments = `[ข้อมูลสินค้าชำรุด / รอส่งเคลม RTB]\n• การเปิดคำขอแจ้งชำรุด: ${hasDefectiveRequest}${defectiveTicket.trim() ? ` (เลขที่คำขอ: ${defectiveTicket.trim()})` : ""}\n• กำหนดการส่งสินค้าออกจากสาขา: ${defectiveDeliveryDate}`;
    } else if (reasonType === "DISCREPANCY") {
      if (!discrepancyReason.trim()) {
        setErrorMsg("กรุณาระบุสาเหตุที่สต๊อกขึ้นในระบบแต่ไม่พบสินค้าจริงในสาขา");
        return;
      }
      if (!confirmedBy.trim()) {
        setErrorMsg("กรุณาระบุชื่อผู้ตรวจสอบและยืนยันความถูกต้อง");
        return;
      }
      reasonText = "สต๊อกไม่ตรงกับระบบ / หาของไม่พบ";
      structuredComments = `[ข้อมูลสต๊อกไม่ตรงกับระบบ]\n• สาเหตุที่ไม่พบสินค้าจริง: ${discrepancyReason.trim()}\n• ผู้ตรวจสอบและยืนยัน: ${confirmedBy.trim()}`;
    } else if (reasonType === "RESERVED") {
      if (!customerName.trim()) {
        setErrorMsg("กรุณาระบุชื่อลูกค้า / ผู้สั่งซื้อที่จองสินค้า");
        return;
      }
      if (!bookingDate) {
        setErrorMsg("กรุณาระบุวันที่ลูกค้าสั่งซื้อหรือวันที่จองสินค้า");
        return;
      }
      if (!deliveryDate) {
        setErrorMsg("กรุณาระบุกำหนดการจัดส่งสินค้าให้ลูกค้า");
        return;
      }
      reasonText = "สินค้าติดจองลูกค้ารอส่งมอบ";
      structuredComments = `[ข้อมูลสินค้าติดจองรอส่งมอบ]\n• ชื่อลูกค้าผู้สั่งจอง: ${customerName.trim()}\n• วันที่สั่งซื้อ/จอง: ${bookingDate}\n• กำหนดการส่งมอบ: ${deliveryDate}`;
    } else {
      reasonText = "อื่นๆ (ระบุรายละเอียดเพิ่มเติม)";
      structuredComments = `[เหตุผลอื่นๆ]`;
    }

    if (additionalNotes.trim()) {
      structuredComments += `\n• หมายเหตุเพิ่มเติม: ${additionalNotes.trim()}`;
    }

    const totalPhotoCount = existingPhotos.length + photos.length;
    if (totalPhotoCount === 0) {
      setErrorMsg("กรุณาแนบรูปถ่ายหลักฐานอย่างน้อย 1 รูป (เช่น รูปสินค้าหน้าร้าน, ป้ายราคา, หรือเอกสาร)");
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
        reason: reasonText,
        comments: structuredComments,
        photos: allPhotoUrls,
        userName: sessionObj?.userName || "พนักงานสาขา",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-xl border-border animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <CardHeader className="p-3.5 sm:p-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">
              {isNeedsRevision ? "แก้ไขข้อมูลคำขอ (ส่งข้อมูลเพิ่มเติม)" : "ยื่นคำขอยกเว้นสินค้า"}
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              รุ่น: {product.model} (รหัส: {product.productCode})
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

        {/* Scrollable Content */}
        <CardContent className="p-3.5 sm:p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Product Summary Box */}
          <div className="bg-muted/40 p-2.5 sm:p-3 rounded-md border border-border space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground text-xs sm:text-sm">{product.model}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {product.nonmoveDaysBucket === "121 up" ? "121 วันขึ้นไป" : `${product.nonmoveDaysBucket} วัน`}
              </Badge>
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground flex justify-between">
              <span>หมวด: {product.categoryName}</span>
              <span>สต๊อก: {product.stockQty} ชิ้น ({formatCurrency(product.stockValue)})</span>
            </div>
          </div>

          {/* Admin Revision Feedback Callout if revision required */}
          {isNeedsRevision && product.activeRequest?.reviewComment && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-2.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-semibold block">ข้อความแจ้งจากผู้อนุมัติ:</span>
              <p>{product.activeRequest.reviewComment}</p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Reason Selector */}
            <div className="space-y-1">
              <label className="font-bold text-foreground block text-[11px]">
                เหตุผลการขอยกเว้น <span className="text-rose-500">*</span>
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
                required
              >
                <option value="">-- กรุณาเลือกเหตุผล --</option>
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* DYNAMIC FIELDS: 1. Display */}
            {reasonType === "DISPLAY" && (
              <div className="rounded-md bg-muted/30 border border-border p-3 space-y-3 animate-in fade-in-50">
                <div className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>ข้อมูลสินค้าตัวโชว์หน้าร้าน</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    1. เหตุผลที่นำสินค้ารุ่นนี้มาจัดแสดงตัวโชว์ <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={displayReason}
                    onChange={(e) => setDisplayReason(e.target.value)}
                    placeholder="เช่น เป็นรุ่นแนะนำตามแผนผังร้าน หรือเปิดตัวโปรโมชันหลัก"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    2. กำหนดการนำตัวโชว์ออก / วันที่ถอดโชว์ <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={displayRemoveDate}
                    onChange={(e) => setDisplayRemoveDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS: 2. Defective / RTB */}
            {reasonType === "DEFECTIVE" && (
              <div className="rounded-md bg-muted/30 border border-border p-3 space-y-3 animate-in fade-in-50">
                <div className="font-semibold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>ข้อมูลสินค้าชำรุด / รอส่งเคลม RTB</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    1. มีการเปิดคำขอแจ้งชำรุดในระบบแล้วหรือไม่ <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHasDefectiveRequest("เปิดคำขอแจ้งชำรุดแล้ว")}
                      className={`p-2 rounded-md border text-xs font-semibold text-center transition-all ${
                        hasDefectiveRequest === "เปิดคำขอแจ้งชำรุดแล้ว"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-muted"
                      }`}
                    >
                      เปิดคำขอแล้ว
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasDefectiveRequest("ยังไม่ได้เปิดคำขอ")}
                      className={`p-2 rounded-md border text-xs font-semibold text-center transition-all ${
                        hasDefectiveRequest === "ยังไม่ได้เปิดคำขอ"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-muted"
                      }`}
                    >
                      ยังไม่ได้เปิด
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    เลขที่ใบแจ้งชำรุด / เอกสารเคลม RTB (ถ้ามี)
                  </label>
                  <Input
                    type="text"
                    value={defectiveTicket}
                    onChange={(e) => setDefectiveTicket(e.target.value)}
                    placeholder="เช่น RTB-2026-0881 หรือเลขที่แจ้งซ่อม"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    2. กำหนดการส่งสินค้าชำรุดออกจากสาขา <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={defectiveDeliveryDate}
                    onChange={(e) => setDefectiveDeliveryDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS: 3. Stock Discrepancy */}
            {reasonType === "DISCREPANCY" && (
              <div className="rounded-md bg-muted/30 border border-border p-3 space-y-3 animate-in fade-in-50">
                <div className="font-semibold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>ข้อมูลสต๊อกไม่ตรงกับระบบ / หาของไม่พบ</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    1. สาเหตุที่สต๊อกขึ้นในระบบแต่ไม่พบสินค้าจริงในสาขา <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="เช่น คีย์รับสินค้าผิดสาขา หรือตรวจนับสต๊อกไม่พบรอดำเนินการตัดยอด"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    2. ผู้ตรวจสอบและยืนยันความถูกต้อง <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={confirmedBy}
                    onChange={(e) => setConfirmedBy(e.target.value)}
                    placeholder="เช่น นายสมศักดิ์ (ผู้จัดการสาขา) หรือหัวหน้าแผนก"
                    required
                  />
                </div>
              </div>
            )}

            {/* DYNAMIC FIELDS: 4. Reserved for Delivery */}
            {reasonType === "RESERVED" && (
              <div className="rounded-md bg-muted/30 border border-border p-3 space-y-3 animate-in fade-in-50">
                <div className="font-semibold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>ข้อมูลสินค้าติดจองลูกค้ารอส่งมอบ</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    1. ชื่อลูกค้า / ผู้สั่งซื้อที่จองสินค้า <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="เช่น คุณสมศรี สุขใจ หรือ หจก. บ้านดีไซน์"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    2. วันที่ลูกค้าสั่งซื้อ / วันที่จองสินค้า <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block text-[11px]">
                    3. กำหนดการจัดส่งสินค้าให้ลูกค้า <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Additional Remarks */}
            <div className="space-y-1">
              <label className="font-bold text-foreground block text-[11px]">
                หมายเหตุหรือรายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติมเพื่อประกอบการพิจารณา..."
                rows={2}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-hidden"
              />
            </div>

            {/* Photo Upload with Previews */}
            <div className="space-y-2 pt-1 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground block text-[11px]">
                  รูปถ่ายหลักฐาน <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  (แนบรูปสินค้าหน้าร้าน, ป้ายราคา, หรือเอกสาร)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Existing Photos */}
                {existingPhotos.map((url, idx) => (
                  <div key={idx} className="relative h-14 w-14 rounded-md border border-border overflow-hidden group">
                    <img src={url} alt="หลักฐาน" className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5">
                      รูปเดิม
                    </span>
                  </div>
                ))}

                {/* New Photo Previews */}
                {photoPreviews.map((url, idx) => (
                  <div key={idx} className="relative h-14 w-14 rounded-md border border-border overflow-hidden group">
                    <img src={url} alt="ตัวอย่างรูป" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(idx)}
                      className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add Photo Button */}
                <label className="h-14 w-14 rounded-md border-2 border-dashed border-input hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/20">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-0.5">เพิ่มรูปภาพ</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 text-xs font-semibold px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 text-xs font-semibold px-5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    กำลังบันทึก...
                  </>
                ) : isNeedsRevision ? (
                  "ส่งข้อมูลแก้ไข"
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

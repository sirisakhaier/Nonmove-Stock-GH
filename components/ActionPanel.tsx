"use client";

import React, { useState } from "react";
import { X, Upload, CheckCircle2, Clock, XCircle, AlertCircle, Image as ImageIcon, Send } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/validators";
import { RequestStatusBadge } from "./RequestStatusBadge";

interface ActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  branchCode: string;
  item: any | null;
  onSuccess: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  isOpen,
  onClose,
  branchCode,
  item,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"EXPLAIN" | "EXCLUDE">("EXPLAIN");
  const [reason, setReason] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const activeRequest = item.activeRequest;
  const isPending = activeRequest?.status === "PENDING";
  const isApproved = activeRequest?.status === "APPROVED";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 5);
      setSelectedFiles(filesArray);
      const urls = filesArray.map((f) => URL.createObjectURL(f));
      setPreviewUrls(urls);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("Please enter a reason or explanation.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let uploadedPhotoUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        for (const file of selectedFiles) {
          formData.append("files", file);
        }
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload photos");
        }
        uploadedPhotoUrls = uploadData.urls || [];
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchCode,
          productCode: item.productCode,
          requestType: activeTab,
          reason,
          photoUrls: uploadedPhotoUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccessMessage("Your request has been submitted and is pending approval!");
      setReason("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm transition-opacity flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                {item.categoryName}
              </span>
              <span className="text-xs font-semibold text-slate-500">Barcode: {item.productCode}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 line-clamp-2">{item.productName}</h2>
            <p className="text-sm text-sky-700 font-semibold mt-0.5">Model: {item.model}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Key Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Nonmove Days</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{item.nonmoveDaysBucket}</p>
            </div>
            <div>
              <span className="text-slate-500">Aging Days</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{item.agingDaysBucket}</p>
            </div>
            <div>
              <span className="text-slate-500">Stock Units</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{formatNumber(item.stockQty)}</p>
            </div>
            <div>
              <span className="text-slate-500">Stock Value</span>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{formatCurrency(item.stockValue)}</p>
            </div>
          </div>

          {/* Current Request Audit History */}
          {activeRequest && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Current Status</span>
                <RequestStatusBadge
                  status={activeRequest.status}
                  requestType={activeRequest.requestType}
                  reviewComment={activeRequest.reviewComment}
                />
              </div>

              <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p>
                  <strong className="text-slate-700">Submitted Reason:</strong> {activeRequest.reason}
                </p>
                {activeRequest.reviewedByName && (
                  <p>
                    <strong className="text-slate-700">Reviewed by:</strong> {activeRequest.reviewedByName} (
                    {activeRequest.reviewedAt ? new Date(activeRequest.reviewedAt).toLocaleDateString() : ""})
                  </p>
                )}
                {activeRequest.reviewComment && (
                  <p className="text-rose-700 font-medium">
                    <strong>Reviewer Note:</strong> {activeRequest.reviewComment}
                  </p>
                )}
              </div>

              {activeRequest.photos && activeRequest.photos.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-600 block mb-1.5">Attached Photos:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeRequest.photos.map((p: any) => (
                      <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={p.url}
                          alt="Proof"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form to submit action */}
          {isPending || isApproved ? (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Request Already Processed or In Review</p>
                <p className="mt-0.5 text-sky-700">
                  This SKU has an active request with status <strong>{activeRequest?.status}</strong>. You cannot submit
                  another request unless the current one is rejected.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("EXPLAIN")}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                    activeTab === "EXPLAIN"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📝 Explain Non-Move Reason
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("EXCLUDE")}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
                    activeTab === "EXCLUDE"
                      ? "bg-white text-rose-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🚫 Request Exclusion
                </button>
              </div>

              <div className="text-xs text-slate-500">
                {activeTab === "EXPLAIN" ? (
                  <p>
                    Provide store-level context on why this item hasn&apos;t sold (e.g. low foot-traffic aisle, display
                    defect, waiting on promo).
                  </p>
                ) : (
                  <p>
                    Request HQ to exclude this SKU from the non-move calculation (e.g. showroom demo unit, reserved order,
                    returned to vendor). Photos recommended.
                  </p>
                )}
              </div>

              {/* Textarea Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  {activeTab === "EXPLAIN" ? "Explanation Note *" : "Exclusion Justification *"}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    activeTab === "EXPLAIN"
                      ? "e.g. Display piece is scratched, pending replacement part from vendor..."
                      : "e.g. SKU is used as floor demonstration, not available for sale..."
                  }
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Photos (Optional, max 5)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-slate-600">Click or drag photos here</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB each</p>
                </div>

                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs tracking-wide shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Submitting..." : "Submit Action Request"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

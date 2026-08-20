"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Upload, FileSpreadsheet, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [passcode, setPasscode] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select an Excel (.xlsx) file.");
      return;
    }
    if (!passcode) {
      setErrorMessage("Please enter the admin passcode.");
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
        throw new Error(data.error || "Failed to process Excel feed.");
      }

      setResultMessage(data.message || "File successfully ingested!");
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Upload and ETL failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-2xl w-full mx-auto px-4 py-10 space-y-6 flex-1">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Upload Daily NonMoveReport</h1>
            <p className="text-xs text-slate-500">
              Ingest a new daily <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">NonMoveReport YYYYMMDD.xlsx</code> Excel feed
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Drop Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Select Excel File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition relative cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                {file ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900">{file.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-slate-600">Click or drag NonMoveReport YYYYMMDD.xlsx here</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Date will be parsed from filename automatically</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Passcode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Admin Passcode
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Admin passcode"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resultMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resultMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !file}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? "Parsing & Ingesting Data..." : "Start Daily Ingestion"}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

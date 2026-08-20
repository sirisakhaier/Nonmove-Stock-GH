"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ApprovalQueueTable } from "@/components/ApprovalQueueTable";
import { CheckSquare, Lock, KeyRound, RefreshCw, AlertCircle } from "lucide-react";

export default function ApprovalsPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("PENDING");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check saved passcode in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("approver_passcode");
    if (saved) {
      setPasscode(saved);
      setIsAuthenticated(true);
    }

    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => {
        if (d.regions) setRegions(d.regions);
      });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError("Please enter the approver passcode.");
      return;
    }
    // Test fetch to verify passcode
    setIsAuthenticated(true);
    localStorage.setItem("approver_passcode", passcode);
  };

  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      let url = `/api/requests?status=${selectedStatus}`;
      if (selectedRegion !== "ALL") url += `&region=${encodeURIComponent(selectedRegion)}`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error("Error loading approvals queue:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedStatus, selectedRegion]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Approver Access Required</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter the approver passcode to review non-move requests
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Approver Passcode"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                required
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
            >
              Unlock Approval Queue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-amber-600" />
              <span>Regional & HQ Approvals Queue</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, approve, or reject non-move stock exclusion and explanation requests
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="PENDING">Pending Decisions</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All Statuses</option>
            </select>

            <button
              onClick={fetchRequests}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Approval Queue Table */}
        <ApprovalQueueTable
          requests={requests}
          onRefresh={fetchRequests}
          passcode={passcode}
        />
      </main>
    </div>
  );
}

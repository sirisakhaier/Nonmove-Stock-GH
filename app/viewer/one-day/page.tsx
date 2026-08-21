"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { OneDayCommandCenter } from "@/components/OneDayCommandCenter";
import { KeyRound } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OneDayAnalysisPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("viewer_passcode");
    if (saved === "viewer1234") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleUnlockViewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "viewer1234") {
      localStorage.setItem("viewer_passcode", passcode);
      setIsAuthenticated(true);
      setPasscodeError("");
    } else {
      setPasscodeError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between transition-colors">
        <Navbar />

        <div className="max-w-sm mx-auto w-full px-4 my-auto">
          <Card className="border-border shadow-xs p-6 text-center space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <KeyRound className="h-6 w-6" />
            </div>

            <div>
              <CardTitle className="text-lg font-bold">
                1-Day Analysis (Executive Viewer)
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                สำหรับผู้บริหาร กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
              </CardDescription>
            </div>

            {passcodeError && (
              <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {passcodeError}
              </div>
            )}

            <form onSubmit={handleUnlockViewer} className="space-y-3.5">
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="รหัสผ่าน Viewer (viewer1234)"
                className="h-9 text-xs text-center font-mono"
              />
              <Button type="submit" className="w-full h-9 text-xs font-semibold">
                เข้าสู่ระบบ Viewer
              </Button>
            </form>
          </Card>
        </div>

        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
          Non-Move Stock Management · Sell out team, Haier (Thailand)
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <OneDayCommandCenter />
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-8">
        Non-Move Stock Management · Sell out team, Haier (Thailand)
      </footer>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StoreTrendPage() {
  const params = useParams();
  const router = useRouter();
  const branchCode = params.branchCode as string;

  useEffect(() => {
    if (branchCode) {
      router.replace(`/dashboard/${branchCode}`);
    }
  }, [branchCode, router]);

  return null;
}

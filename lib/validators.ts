export function validateThaiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Thai mobile format starts with 0 and has 10 digits (e.g. 0812345678, 0912345678, 0612345678)
  // Or 9 digits for landlines
  return /^0[0-9]{8,9}$/.test(cleaned);
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return "฿0";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("th-TH").format(value);
}

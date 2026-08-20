export function validateThaiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, "");
  return /^0[0-9]{8,9}$/.test(cleaned);
}

export const isValidThaiPhone = validateThaiPhone;

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

export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

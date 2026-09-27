import { stockStatus } from "@/lib/catalog";

const TONES = {
  in: "text-emerald-400",
  low: "text-warn",
  out: "text-danger",
};

export function StockBadge({ stock }: { stock: number }) {
  const status = stockStatus(stock);
  return <span className={`text-xs font-medium ${TONES[status.tone]}`}>{status.label}</span>;
}

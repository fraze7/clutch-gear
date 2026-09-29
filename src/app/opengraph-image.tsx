// The preview image shown when a link to the site is shared (LinkedIn, Slack, Discord...)
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Clutch Gear — gaming mice, keyboards and headsets. A portfolio demo store.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const keyboard = await readFile(join(process.cwd(), "public/products/rapid-75.svg"), "utf8");
  const keyboardSrc = `data:image/svg+xml;base64,${Buffer.from(keyboard).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0d12", color: "#e6e8ee" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 80px", width: 620 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, letterSpacing: -2 }}>
            CLUTCH<span style={{ color: "#22d3ee" }}>GEAR</span>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, marginTop: 24, lineHeight: 1.15 }}>Gear for the clutch moments.</div>
          <div style={{ fontSize: 26, color: "#9aa3b2", marginTop: 24, lineHeight: 1.4 }}>
            Full-stack Next.js store: catalogue, cart, Stripe checkout, accounts and admin.
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#04212a", background: "#22d3ee", borderRadius: 8, padding: "8px 16px", marginTop: 32, alignSelf: "flex-start" }}>
            Portfolio demo · Stripe test mode
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> only */}
        <img src={keyboardSrc} width={560} height={560} style={{ marginTop: 35 }} alt="" />
      </div>
    ),
    size
  );
}

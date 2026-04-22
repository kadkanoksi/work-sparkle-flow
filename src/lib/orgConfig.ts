// =============================================================
// Organization Email Domain Allowlist
// -------------------------------------------------------------
// แก้ไขรายการนี้เพื่อกำหนดโดเมนอีเมลที่อนุญาตให้สมัครและเข้าสู่ระบบ
// ตัวอย่าง: ["doa.in.th", "moac.go.th"]
// =============================================================
export const ALLOWED_EMAIL_DOMAINS: string[] = [
  "doa.in.th",
  "moac.go.th",
];

export const ORG_NAME = "ระบบแจกจ่ายงานวิเคราะห์";

export function isAllowedEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 0) return false;
  const domain = e.slice(at + 1);
  return ALLOWED_EMAIL_DOMAINS.some(
    (d) => domain === d.toLowerCase() || domain.endsWith("." + d.toLowerCase())
  );
}

export function allowedDomainsLabel(): string {
  return ALLOWED_EMAIL_DOMAINS.map((d) => "@" + d).join(", ");
}

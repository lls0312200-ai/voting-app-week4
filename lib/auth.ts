import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const DAY = 60 * 60 * 24;
export const adminCookie = "voting_admin";
export const voterCookie = "voting_voter";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET을 32자 이상으로 설정해 주세요.");
  return value;
}

export function verifyPassword(value: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12) throw new Error("ADMIN_PASSWORD를 12자 이상으로 설정해 주세요.");
  if (typeof value !== "string") return false;
  const left = createHash("sha256").update(value).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function makeSession(): string {
  const expiry = Math.floor(Date.now() / 1000) + DAY;
  const signature = createHmac("sha256", secret()).update(String(expiry)).digest("hex");
  return `${expiry}.${signature}`;
}

export function isAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const [expiryText, signature] = value.split(".");
  const expiry = Number(expiryText);
  if (!Number.isSafeInteger(expiry) || expiry < Date.now() / 1000 || !/^[a-f0-9]{64}$/.test(signature ?? "")) return false;
  try {
    const expected = createHmac("sha256", secret()).update(expiryText).digest();
    return timingSafeEqual(expected, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export const cookieOptions = (request: Request) => ({
  httpOnly: true,
  secure: new URL(request.url).protocol === "https:",
  sameSite: "lax" as const,
  path: "/",
});

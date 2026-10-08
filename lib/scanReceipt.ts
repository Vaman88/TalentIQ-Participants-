import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const lifetime = 30 * 60 * 1000;

export function signScan(pdf: Uint8Array, key: string, now = Date.now()) {
  if (!key) throw new Error("Scan signing is unavailable.");
  const payload = `${now + lifetime}:${createHash("sha256").update(pdf).digest("hex")}`;
  const signature = createHmac("sha256", key).update(`resume-scan:${payload}`).digest("hex");
  return `${payload}:${signature}`;
}

export function verifyScan(pdf: Uint8Array, token: string, key: string, now = Date.now()) {
  if (!key || !/^\d{13}:[a-f0-9]{64}:[a-f0-9]{64}$/.test(token)) return false;
  const [expires, hash, signature] = token.split(":");
  if (Number(expires) <= now || Number(expires) > now + lifetime) return false;
  if (createHash("sha256").update(pdf).digest("hex") !== hash) return false;
  const expected = createHmac("sha256", key).update(`resume-scan:${expires}:${hash}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

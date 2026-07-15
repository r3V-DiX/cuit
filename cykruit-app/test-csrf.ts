import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

const TOKEN_SEPARATOR = ".";
const csrfSecret = process.env.CSRF_SECRET;
const jwtSecret = process.env.JWT_SECRET;
const keyMaterial = csrfSecret || jwtSecret;

if (!keyMaterial) throw new Error("No secret");

const secret = createHmac("sha256", keyMaterial).update("csrf-token-v1").digest("hex");

function generateToken(): string {
    const nonce = randomBytes(32).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
    const sig = createHmac("sha256", secret).update(payload).digest("hex");
    return `${payload}${TOKEN_SEPARATOR}${sig}`;
}

function verifyToken(token: string): boolean {
    const parts = token.split(TOKEN_SEPARATOR);
    if (parts.length !== 3) return false;
    const [nonce, timestamp, sig] = parts;
    const issuedAt = parseInt(timestamp, 36);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - issuedAt > 24 * 60 * 60) return false;
    const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
    try {
        return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
    } catch {
        return false;
    }
}

const t = generateToken();
console.log("Token:", t);
console.log("Valid:", verifyToken(t));

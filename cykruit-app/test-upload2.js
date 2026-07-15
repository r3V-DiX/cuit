const { createHmac, randomBytes } = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const TOKEN_SEPARATOR = ".";
const keyMaterial = process.env.CSRF_SECRET || process.env.JWT_SECRET;
const secret = createHmac("sha256", keyMaterial).update("csrf-token-v1").digest("hex");

function generateToken() {
    const nonce = randomBytes(32).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
    const sig = createHmac("sha256", secret).update(payload).digest("hex");
    return `${payload}${TOKEN_SEPARATOR}${sig}`;
}

async function run() {
  const token = generateToken();
  const fd = new FormData();
  const blob = new Blob(["test"], { type: "text/plain" });
  fd.append("file", blob, "test.txt");
  
  const uploadRes = await fetch("http://127.0.0.1:4004/employer/company/logo", {
    method: "POST",
    headers: {
      "x-csrf-token": token,
    },
    body: fd
  });
  console.log("Upload response:", uploadRes.status);
  const uploadData = await uploadRes.text();
  console.log("Upload data:", uploadData);
}
run();

// libs/upload/src/magic-bytes.ts

export const SIGNATURES: Array<{ mime: string; check: (b: Buffer) => boolean }> = [
  { mime: "application/pdf",  check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 }, // %PDF
  { mime: "image/jpeg",       check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png",        check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 }, // \x89PNG
  { mime: "image/gif",        check: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 }, // GIF8
  { mime: "image/webp",       check: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 }, // RIFF (WebP container)
  // DOCX, XLSX, PPTX are ZIP-based: PK\x03\x04
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", check: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
  { mime: "application/zip",  check: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
];

export function matchesMagicBytes(buffer: Buffer, mimetype: string): boolean {
  if (!buffer || buffer.length < 4) return true; // too short to check — size validation handles this

  const sig = SIGNATURES.find((s) => s.mime === mimetype);
  if (!sig) return true; // unknown mime — skip magic check (size+mime already validated)

  return sig.check(buffer);
}

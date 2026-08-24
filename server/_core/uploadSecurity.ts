import { TRPCError } from "@trpc/server";

export type SafeUploadType = {
  mimeType: string;
  extensions: readonly string[];
  hasExpectedSignature: (bytes: Buffer) => boolean;
};

const hasPrefix = (bytes: Buffer, expected: readonly number[]) =>
  expected.every((value, index) => bytes[index] === value);

const hasAsciiAt = (bytes: Buffer, offset: number, value: string) =>
  bytes.subarray(offset, offset + value.length).toString("ascii") === value;

export const SAFE_IMAGE_TYPES: readonly SafeUploadType[] = [
  { mimeType: "image/jpeg", extensions: ["jpg", "jpeg"], hasExpectedSignature: bytes => hasPrefix(bytes, [0xff, 0xd8, 0xff]) },
  { mimeType: "image/png", extensions: ["png"], hasExpectedSignature: bytes => hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { mimeType: "image/webp", extensions: ["webp"], hasExpectedSignature: bytes => hasAsciiAt(bytes, 0, "RIFF") && hasAsciiAt(bytes, 8, "WEBP") },
];

export const SAFE_VIDEO_TYPES: readonly SafeUploadType[] = [
  { mimeType: "video/mp4", extensions: ["mp4"], hasExpectedSignature: bytes => hasAsciiAt(bytes, 4, "ftyp") },
  { mimeType: "video/webm", extensions: ["webm"], hasExpectedSignature: bytes => hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]) },
];

export const SAFE_DOCUMENT_TYPES: readonly SafeUploadType[] = [
  { mimeType: "application/pdf", extensions: ["pdf"], hasExpectedSignature: bytes => hasAsciiAt(bytes, 0, "%PDF-") },
  { mimeType: "application/msword", extensions: ["doc"], hasExpectedSignature: bytes => hasPrefix(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) },
  { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extensions: ["docx"], hasExpectedSignature: bytes => hasPrefix(bytes, [0x50, 0x4b, 0x03, 0x04]) },
  ...SAFE_IMAGE_TYPES,
];

export function normalizeUploadFileName(fileName: string) {
  const normalized = fileName.trim().replace(/[\\/]/g, "_");
  if (!normalized || normalized.length > 120 || /[^a-zA-Z0-9._ -]/.test(normalized)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "File name contains unsupported characters." });
  }
  const extension = normalized.split(".").pop()?.toLowerCase();
  if (!extension || extension === normalized.toLowerCase()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "File name needs a valid extension." });
  }
  return { normalized, extension };
}

export function decodeAndValidateUpload(input: {
  fileName: string;
  contentType: string;
  data: string;
  allowedTypes: readonly SafeUploadType[];
  maxBytes: number;
}) {
  const { extension } = normalizeUploadFileName(input.fileName);
  const encoded = input.data.includes(",") ? input.data.split(",").pop() ?? "" : input.data;
  const maxEncodedLength = Math.ceil((input.maxBytes * 4) / 3) + 8;
  if (!encoded || encoded.length > maxEncodedLength || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload data is invalid or too large." });
  }
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > input.maxBytes) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload is empty or exceeds the permitted size." });
  }
  const safeType = input.allowedTypes.find(type => type.mimeType === input.contentType);
  if (!safeType || !safeType.extensions.includes(extension) || !safeType.hasExpectedSignature(bytes)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "File type, extension, or content signature is not permitted." });
  }
  return { bytes, extension };
}

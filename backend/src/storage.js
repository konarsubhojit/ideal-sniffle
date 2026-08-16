import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
export const ALLOWED_RECEIPT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

let storageClient;

function storageConfig() {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
  } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('Receipt storage is not configured');
  }
  return { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL };
}

function getClient() {
  if (!storageClient) {
    const config = storageConfig();
    storageClient = new S3Client({
      region: 'auto',
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return storageClient;
}

function detectedMimeType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return 'application/pdf';
  }
  return null;
}

export function validateReceiptFile(file) {
  if (!file?.buffer || !ALLOWED_RECEIPT_TYPES.has(file.mimetype)) {
    throw new Error('Receipt file type is not supported');
  }
  if (file.size > MAX_RECEIPT_SIZE) {
    throw new Error('Receipt file exceeds the 5 MB limit');
  }
  const actualType = detectedMimeType(file.buffer);
  if (actualType !== file.mimetype) {
    throw new Error('Receipt content does not match its declared MIME type');
  }
  return actualType;
}

function dependencies(options = {}) {
  const config = options.bucket ? null : storageConfig();
  return {
    client: options.client || getClient(),
    bucket: options.bucket || config.R2_BUCKET,
  };
}

export async function uploadReceipt(file, key, options = {}) {
  const contentType = validateReceiptFile(file);
  const { client, bucket } = dependencies(options);
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: contentType,
  }));
}

export async function deleteReceipt(key, options = {}) {
  const { client, bucket } = dependencies(options);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getReceiptUrl(key, options = {}) {
  const { client, bucket } = dependencies(options);
  const expiresIn = options.expiresIn || 300;
  return (options.presign || getSignedUrl)(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}

export function isReceiptStorageConfigured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID
    && process.env.R2_ACCESS_KEY_ID
    && process.env.R2_SECRET_ACCESS_KEY
    && process.env.R2_BUCKET,
  );
}

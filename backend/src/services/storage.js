const fs = require('node:fs');
const {
  S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
const Bucket = process.env.R2_BUCKET;

async function uploadFile(key, body, contentType = 'application/pdf') {
  await client.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
}

// streams a big file from disk in parts, so it never sits fully in memory
async function uploadLarge(key, filePath, contentType = 'application/pdf') {
  const upload = new Upload({
    client,
    params: { Bucket, Key: key, Body: fs.createReadStream(filePath), ContentType: contentType },
    queueSize: 3,
    partSize: 8 * 1024 * 1024,
  });
  await upload.done();
}

// range example: "bytes=0-1048575". Without it you get the whole file.
async function getFileStream(key, range) {
  const res = await client.send(new GetObjectCommand({ Bucket, Key: key, ...(range ? { Range: range } : {}) }));
  return { stream: res.Body, size: res.ContentLength, contentType: res.ContentType, contentRange: res.ContentRange };
}

// size in bytes, or null if the file does not exist
async function fileSize(key) {
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
    return res.ContentLength;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}
const fileExists = async (key) => (await fileSize(key)) !== null;

async function deleteFile(key) {
  await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
}

// short-lived link the browser follows straight to the bucket
async function getSignedFileUrl(key, { disposition = 'inline', filename, expiresIn = 300 } = {}) {
  const command = new GetObjectCommand({
    Bucket, Key: key,
    ResponseContentType: 'application/pdf',
    ResponseContentDisposition: `${disposition}; filename="${filename}"`,
  });
  return getSignedUrl(client, command, { expiresIn });
}

module.exports = { uploadFile, uploadLarge, getFileStream, fileSize, fileExists, deleteFile, getSignedFileUrl };
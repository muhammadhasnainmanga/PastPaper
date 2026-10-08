const {
  S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  // newer SDK versions add extra checksum headers that some S3-compatible services reject
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const Bucket = process.env.B2_BUCKET;

// key looks like "11/physics/2025/objective.pdf"
async function uploadFile(key, body, contentType = 'application/pdf') {
  await client.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
}

// returns a stream, so big files are never loaded fully into memory
async function getFileStream(key) {
  const res = await client.send(new GetObjectCommand({ Bucket, Key: key }));
  return { stream: res.Body, size: res.ContentLength, contentType: res.ContentType };
}

async function fileExists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

async function deleteFile(key) {
  await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
}

module.exports = { uploadFile, getFileStream, fileExists, deleteFile };
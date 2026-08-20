import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT;
const bucket = process.env.STORAGE_BUCKET || "nonmove-photos";
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL;

let s3Client: S3Client | null = null;

if (endpoint && accessKeyId && secretAccessKey) {
  s3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadPhoto(
  fileBuffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const uniqueKey = `requests/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: uniqueKey,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, "")}/${uniqueKey}`;
    }
    return `${endpoint?.replace(/\/$/, "")}/${bucket}/${uniqueKey}`;
  }

  // Development / fallback: return Data URL
  const base64Data = fileBuffer.toString("base64");
  return `data:${contentType};base64,${base64Data}`;
}

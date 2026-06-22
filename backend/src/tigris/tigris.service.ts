import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TigrisService {
  private client: S3Client | null = null;
  private bucket: string | null = null;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.bucket = process.env.BUCKET_NAME ?? null;

    if (accessKeyId && secretAccessKey && this.bucket) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: 'https://fly.storage.tigris.dev',
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;

    if (this.client && this.bucket) {
      const key = `${folder}/${filename}`;
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      return `https://${this.bucket}.fly.storage.tigris.dev/${key}`;
    }

    // Local fallback: save to disk
    const dir = path.join(process.cwd(), 'uploads', folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    return `/uploads/${folder}/${filename}`;
  }
}

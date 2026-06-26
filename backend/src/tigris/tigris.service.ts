// EN: Tigris service: uploads files to Tigris (S3-compatible) storage, falling back to local disk.
// ES: Servicio Tigris: sube archivos al almacenamiento Tigris (compatible con S3), con respaldo en disco local.
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// EN: Injectable Tigris service that initializes the S3 client only when credentials/bucket are present.
// ES: Servicio Tigris inyectable que inicializa el cliente S3 solo si hay credenciales/bucket disponibles.
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

  // EN: Uploads a file to Tigris and returns its public URL, or saves to local disk as fallback.
  // ES: Sube un archivo a Tigris y devuelve su URL pública, o lo guarda en disco local como respaldo.
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

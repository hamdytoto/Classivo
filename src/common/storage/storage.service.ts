import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getStorageConfig } from '../config/storage.config';

@Injectable()
export class StorageService {
  private readonly config = getStorageConfig();
  private readonly client = new S3Client({
    region: this.config.region,
    endpoint: this.config.endpoint,
    forcePathStyle: this.config.forcePathStyle,
    credentials: {
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    },
  });

  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }

  async getSignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getSignedUploadUrl(
    key: string,
    contentType?: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

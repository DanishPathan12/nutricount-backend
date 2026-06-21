import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { env } from '../config/env';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export class S3Service {
  /**
   * Generates a pre-signed URL for uploading a file to S3.
   */
  static async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    userId: string
  ): Promise<PresignedUrlResponse> {
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    const fileCategory = fileType.startsWith('image/') ? 'images' : 'videos';
    const uniqueId = crypto.randomUUID();
    const key = `uploads/${fileCategory}/${userId}/${uniqueId}${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      // Signed URL expires in 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      const fileUrl = `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        fileUrl,
        key,
      };
    } catch (error) {
      console.error('Error generating S3 presigned URL:', error);
      throw error;
    }
  }
}

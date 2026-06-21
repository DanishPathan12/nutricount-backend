import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { S3Service } from '../../services/s3.service';

// Validation Schema for requesting pre-signed URL
export const getPresignedUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().refine(
    (val) => {
      const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideos = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/ogg',
        'video/webm',
      ];
      return allowedImages.includes(val) || allowedVideos.includes(val);
    },
    {
      message: 'Unsupported file type. Only standard images and videos are allowed.',
    }
  ),
});

/**
 * Controller to generate a presigned S3 upload URL.
 */
export const getPresignedUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const validated = getPresignedUrlSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await S3Service.getPresignedUploadUrl(
      validated.fileName,
      validated.fileType,
      userId
    );

    return res.status(200).json({
      success: true,
      message: 'Presigned URL generated successfully',
      data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error);
  }
};

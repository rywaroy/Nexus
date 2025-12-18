export interface UploadResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface IStorageStrategy {
  upload(file: Express.Multer.File): Promise<UploadResult>;
}

export const STORAGE_STRATEGY = 'STORAGE_STRATEGY';

export interface StorageUploadResult {
  url: string;
  public_id: string;
  format: string;
  bytes: number;
  originalName: string;
}

export interface IStorageProvider {
  uploadFile(
    file: Express.Multer.File,
    folder: string,
    resourceType?: 'auto' | 'image' | 'raw' | 'video',
  ): Promise<StorageUploadResult>;

  deleteFile(
    keyOrPublicId: string,
    resourceType?: 'auto' | 'image' | 'raw' | 'video',
  ): Promise<{ success: boolean; result?: string }>;

  deleteFileByUrl(url: string): Promise<{ success: boolean; result?: string }>;

  isManagedUrl(url: string): boolean;
}
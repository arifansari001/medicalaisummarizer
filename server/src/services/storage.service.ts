import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

export interface StorageFile {
  filePath: string;
  fileUrl: string;
}

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  }

  private async ensureUserDir(userId: string): Promise<string> {
    const userDir = path.join(this.baseDir, userId);
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
  }

  async saveFile(userId: string, originalName: string, buffer: Buffer): Promise<StorageFile> {
    const userDir = await this.ensureUserDir(userId);
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const fullPath = path.join(userDir, fileName);

    await fs.writeFile(fullPath, buffer);

    const relativePath = path.relative(this.baseDir, fullPath).replace(/\\/g, '/');
    const fileUrl = `/uploads/${relativePath}`;

    return {
      filePath: fullPath,
      fileUrl,
    };
  }

  async getFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
      }
    }
  }
}

export const storageService = new StorageService();

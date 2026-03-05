import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";

// Resolve uploads directory relative to project root (backend/)
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

class StorageService {
  constructor() {
    // Ensure root uploads directory exists
    this.ensureDir(UPLOADS_DIR);
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getBaseUrl(): string {
    const port = env.PORT || 3000;
    return `http://localhost:${port}`;
  }

  /**
   * Upload a file to local disk storage
   * @param file Express.Multer.File object
   * @param folder Optional folder path within uploads/
   * @returns Full public URL of the uploaded file
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = "uploads",
  ): Promise<string> {
    const folderPath = path.join(UPLOADS_DIR, folder);
    this.ensureDir(folderPath);

    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${nanoid()}.${fileExtension}`;
    const filePath = path.join(folderPath, fileName);

    // Write the buffer to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Return a full URL that Express static middleware will serve
    return `${this.getBaseUrl()}/uploads/${folder}/${fileName}`;
  }

  /**
   * Delete a file from local disk storage
   * @param url Full URL or path of the file
   */
  async deleteFile(url: string): Promise<void> {
    // Extract path after /uploads/ from either full URL or relative path
    // e.g. "http://localhost:3000/uploads/avatars/abc.png" → "avatars/abc.png"
    // e.g. "/uploads/avatars/abc.png" → "avatars/abc.png"
    const match = url.match(/\/uploads\/(.+)/);
    if (!match?.[1]) return;

    const filePath = path.join(UPLOADS_DIR, match[1]);

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error("Failed to delete file:", filePath, error);
    }
  }
}

export const storageService = new StorageService();

import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { FileData } from '../models/file.model';
import { FileStatus } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class FileService {
  private FILE_KEY = 'files';

  constructor(private storage: StorageService) {}

  getFiles(): FileData[] {
    return this.storage.get<FileData[]>(this.FILE_KEY) || [];
  }

  getFilesByUser(userId: string): FileData[] {
    return this.getFiles().filter(f => f.uploadedBy === userId);
  }

  uploadFile(file: File, userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const files = this.getFiles(); 
        // console.log(reader.result);
        const newFile: FileData = {
          id: crypto.randomUUID(),
          owner: username,
          fileName: file.name,
          fileUrl: reader.result as string,
          uploadedBy: userId,
          status: FileStatus.PENDING,
          createdAt: new Date().toISOString(),
        };
        
        files.push(newFile);
        this.storage.set(this.FILE_KEY, files);
        resolve();
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  updateStatus(fileId: string, status: FileStatus): void {
    const files = this.getFiles();
    const file = files.find(f => f.id === fileId);
    if (file) {
      file.status = status;
      this.storage.set(this.FILE_KEY, files); 
    }
  }

  deleteFile(fileId: string): void {
    const files = this.getFiles().filter(f => f.id !== fileId);
    this.storage.set(this.FILE_KEY, files);
  }

  deleteFilesByUser(userId: string): void {
    const files = this.getFiles().filter(f => f.uploadedBy !== userId);
    this.storage.set(this.FILE_KEY, files);
  }
}
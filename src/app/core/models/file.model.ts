import { FileStatus } from './enums';

export interface FileData {
  id: string;
  owner: string;
  fileName: string;
  fileUrl: string; // base64 or mock URL
  uploadedBy: string; // userId
  status: FileStatus;
  createdAt: string;
}
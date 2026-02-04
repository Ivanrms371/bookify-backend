import 'express';
import { File } from 'multer';

declare global {
  namespace Express {
    export interface Multer {
      File: File;
    }
  }
}

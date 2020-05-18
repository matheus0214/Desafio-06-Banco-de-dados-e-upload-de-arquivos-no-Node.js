import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

const FILES_PATH = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: FILES_PATH,
  storage: multer.diskStorage({
    destination: FILES_PATH,
    filename: (request, file, callback) => {
      const randomBytes = crypto.randomBytes(16).toString('HEX');
      const filename = `${randomBytes}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
};

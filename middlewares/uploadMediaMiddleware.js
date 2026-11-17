import multer from "multer";
import path from "path";
import fs from "fs";

const mediaDir = path.join("uploads", "media");
fs.mkdirSync(mediaDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mediaDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limits for media
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    
    const allowedExtensions = [".pdf", ".mp3", ".wav", ".mpeg", ".mp4", ".mov"];
    const allowedMimes = [
      "application/pdf", 
      "audio/mpeg", "audio/mp3", "audio/wav", 
      "video/mp4", "video/quicktime"
    ];

    if (!allowedExtensions.includes(ext) || !allowedMimes.includes(mimeType)) {
      const error = new Error('INVALID_MEDIA_FORMAT');
      error.code = 'INVALID_MEDIA_FORMAT';
      return cb(error, false);
    }
    cb(null, true);
  },
});

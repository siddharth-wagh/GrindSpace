import multer from "multer";
import path from "path";
<<<<<<< HEAD
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;
=======

>>>>>>> 8b58ac161bd06db36442ac8d6732568699217eb5

// Store the file temporarily in memory (not on disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
});

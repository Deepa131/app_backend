const multer = require("multer");
const path = require("path");
const fs = require("fs");

const maxImageSize = 2 * 1024 * 1024; // 2MB
const maxVideoSize = 50 * 1024 * 1024; // 50MB

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";

    if (file.fieldname === "profilePicture") {
      uploadPath = path.join("public", "profile_pictures");
    } else if (file.fieldname === "images") {
      uploadPath = path.join("public", "room_images");
    } else if (file.fieldname === "videos") {
      uploadPath = path.join("public", "room_videos");
    } else {
      return cb(new Error("Invalid field name for upload"), false);
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix =
      file.fieldname === "profilePicture"
        ? "pro-pic"
        : file.fieldname === "images"
        ? "room-img"
        : "room-vid";

    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const imageTypes = /\.(jpg|jpeg|png)$/i;
  const videoTypes = /\.(mp4|mov|avi)$/i;

  if (file.fieldname === "profilePicture" || file.fieldname === "images") {
    if (!imageTypes.test(file.originalname)) {
      return cb(new Error("Only image files are allowed"), false);
    }
  }

  if (file.fieldname === "videos") {
    if (!videoTypes.test(file.originalname)) {
      return cb(new Error("Only video files are allowed"), false);
    }
  }

  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxImageSize },
});

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxVideoSize },
});

module.exports = {
  uploadImage,
  uploadVideo,
};

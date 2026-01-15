const multer = require("multer");
const maxSize = 2 * 1024 * 1024; // 2MB for images
const maxVideoSize = 50 * 1024 * 1024; // 50MB for videos
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profilePicture") {
      cb(null, path.join("public", "profile_pictures"));
    } else if (file.fieldname === "itemPhoto") {
      cb(null, path.join("public", "item_photos"));
    } else if (file.fieldname === "itemVideo") {
      cb(null, path.join("public", "item_videos"));
    } else {
      return cb(new Error("Invalid field name for upload."), false);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let prefix = "file";
    if (file.fieldname === "profilePicture") {
      prefix = "pro-pic";
    } else if (file.fieldname === "itemPhoto") {
      prefix = "itm-pic";
    } else if (file.fieldname === "itemVideo") {
      prefix = "item-vid";
    }
    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "itemVideo") {
    if (!file.originalname.match(/\.(mp4|avi|mov|wmv)$/i)) {
      cb(new Error("Video format not supported."), false);
      return;
    }
    cb(null, true);
    return;
  } else if (
    file.fieldname === "profilePicture" ||
    file.fieldname === "itemPhoto"
  ) {
    console.log("Im here");
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      cb(new Error("Image format not supported."), false);
      return;
    }
    cb(null, true);
    return;
  } else {
    cb(new Error("Invalid field name for upload."), false);
    return;
  }
};

// For images (profile pictures and item photos)
const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: maxSize },
});

// For videos (item videos)
const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: maxVideoSize },
});

// Export single upload for backward compatibility
const upload = uploadImage;

module.exports = upload;
module.exports.uploadImage = uploadImage;
module.exports.uploadVideo = uploadVideo;

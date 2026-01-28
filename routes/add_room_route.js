const express = require("express");
const router = express.Router();
const { uploadImage, uploadVideo } = require("../middleware/uploads");
const { protect } = require("../middleware/auth");

const {
  createRoom,
  getAllRooms,
  getRoomById,
  getRoomsByOwner,
  updateRoom,
  deleteRoom,
  uploadRoomImage,
  uploadRoomVideo,
} = require("../controllers/add_room_controller");

// Upload routes (protected)
router.post(
  "/upload-image",
  protect,
  uploadImage.single("images"),
  uploadRoomImage
);

router.post(
  "/upload-video",
  protect,
  uploadVideo.single("videos"),
  uploadRoomVideo
);

// CRUD routes
router.post("/", protect, createRoom);
router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.get("/owner/:ownerId", getRoomsByOwner);
router.put("/:id", protect, updateRoom);
router.delete("/:id", protect, deleteRoom);

module.exports = router;

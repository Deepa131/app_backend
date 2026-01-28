const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  createRoomType,
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
} = require("../controllers/room_type_controller");

router.get("/", getAllRoomTypes);
router.post("/", protect, createRoomType);
router.get("/:id", getRoomTypeById);
router.put("/:id", protect, updateRoomType);
router.delete("/:id", protect, deleteRoomType);

module.exports = router;

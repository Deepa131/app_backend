const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploads");
const { protect } = require("../middleware/auth");

const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  uploadProfilePicture,
} = require("../controllers/user_controller");

router.post("/upload", upload.single("profilePicture"), uploadProfilePicture);

router.post("/", createUser);
router.get("/", protect, getAllUsers); // Protected - prevents user enumeration
router.post("/login", loginUser);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.get("/:id", getUserById);

module.exports = router;

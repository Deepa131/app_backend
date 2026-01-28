const asyncHandler = require("../middleware/async");
const AddRoom = require("../models/add_room_model");
const RoomType = require("../models/room_type_model");
const path = require("path");
const fs = require("fs");

// @desc    Create a new room
// @route   POST /api/v1/rooms
// @access  Private
exports.createRoom = asyncHandler(async (req, res) => {
  const {
    ownerContactNumber,
    roomTitle,
    monthlyPrice,
    location,
    roomType,
    description,
    images,
    videos,
  } = req.body;

  // Get ownerId from authenticated user
  const ownerId = req.user._id;

  // Validate required fields
  if (!roomTitle || !monthlyPrice || !location || !roomType) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields: roomTitle, monthlyPrice, location, roomType",
    });
  }

  // Handle roomType - accept either ObjectId or room type name
  let roomTypeId = roomType;
  
  // Check if roomType is a valid MongoDB ObjectId
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(roomType);
  
  if (!isValidObjectId) {
    // Try to find room type by name
    const foundRoomType = await RoomType.findOne({ typeName: roomType });
    
    if (!foundRoomType) {
      return res.status(400).json({
        success: false,
        message: `Room type "${roomType}" not found. Please use a valid room type name or ObjectId.`,
      });
    }
    
    roomTypeId = foundRoomType._id;
  }

  const room = await AddRoom.create({
    ownerId,
    ownerContactNumber,
    roomTitle,
    monthlyPrice,
    location,
    roomType: roomTypeId,
    description,
    images,
    videos,
  });

  res.status(201).json({
    success: true,
    data: room,
  });
});

// @desc    Get all rooms
// @route   GET /api/v1/rooms
// @access  Public
exports.getAllRooms = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.ownerId) filter.ownerId = req.query.ownerId;
  if (req.query.isAvailable !== undefined)
    filter.isAvailable = req.query.isAvailable === "true";
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;

  const total = await AddRoom.countDocuments(filter);
  const rooms = await AddRoom.find(filter)
    .populate("ownerId", "name email")
    .populate("roomType", "typeName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: rooms.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: rooms,
  });
});

// @desc    Get a single room by ID
// @route   GET /api/v1/rooms/:id
// @access  Public
exports.getRoomById = asyncHandler(async (req, res) => {
  const room = await AddRoom.findById(req.params.id)
    .populate("ownerId", "name email")
    .populate("roomType", "typeName");

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Get rooms by owner
// @route   GET /api/v1/rooms/owner/:ownerId
// @access  Public
exports.getRoomsByOwner = asyncHandler(async (req, res) => {
  const rooms = await AddRoom.find({ ownerId: req.params.ownerId })
    .populate("ownerId", "name email")
    .populate("roomType", "typeName");

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// @desc    Update a room
// @route   PUT /api/v1/rooms/:id
// @access  Private
exports.updateRoom = asyncHandler(async (req, res) => {
  const {
    ownerId,
    ownerContactNumber,
    roomTitle,
    monthlyPrice,
    location,
    roomType,
    description,
    images,
    videos,
    isAvailable,
    approvalStatus,
  } = req.body;

  const room = await AddRoom.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  // Authorization check
  if (room.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized to update this room" });
  }

  room.ownerContactNumber = ownerContactNumber || room.ownerContactNumber;
  room.roomTitle = roomTitle || room.roomTitle;
  room.monthlyPrice = monthlyPrice || room.monthlyPrice;
  room.location = location || room.location;
  room.roomType = roomType || room.roomType;
  room.description = description || room.description;
  room.images = images || room.images;
  room.videos = videos || room.videos;
  room.isAvailable = isAvailable !== undefined ? isAvailable : room.isAvailable;
  room.approvalStatus = approvalStatus || room.approvalStatus;

  await room.save();

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Delete a room
// @route   DELETE /api/v1/rooms/:id
// @access  Private
exports.deleteRoom = asyncHandler(async (req, res) => {
  const room = await AddRoom.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  // Authorization check
  if (room.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized to delete this room" });
  }

  // Delete room images/videos if stored locally
  const mediaPaths = [...(room.images || []), ...(room.videos || [])];
  mediaPaths.forEach((file) => {
    const fullPath = path.join(__dirname, "../public/uploads", file);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  });

  await AddRoom.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Room deleted successfully",
  });
});

// @desc    Upload room image
// @route   POST /api/v1/rooms/upload-image
// @access  Private
exports.uploadRoomImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an image file" });
  }

  if (req.file.size > process.env.MAX_FILE_UPLOAD) {
    return res.status(400).json({
      message: `Please upload an image smaller than ${process.env.MAX_FILE_UPLOAD} bytes`,
    });
  }

  res.status(200).json({
    success: true,
    data: req.file.filename,
    message: "Image uploaded successfully",
  });
});

// @desc    Upload room video
// @route   POST /api/v1/rooms/upload-video
// @access  Private
exports.uploadRoomVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a video file" });
  }

  if (req.file.size > process.env.MAX_FILE_UPLOAD) {
    return res.status(400).json({
      message: `Please upload a video smaller than ${process.env.MAX_FILE_UPLOAD} bytes`,
    });
  }

  res.status(200).json({
    success: true,
    data: req.file.filename,
    message: "Video uploaded successfully",
  });
});

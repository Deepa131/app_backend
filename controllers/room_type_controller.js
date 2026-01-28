const asyncHandler = require("../middleware/async");
const RoomType = require("../models/room_type_model");

// @desc    Create a new room type
// @route   POST /api/room-types
// @access  Private (Admin)

exports.createRoomType = asyncHandler(async (req, res) => {
  const { typeName, status } = req.body;

  if (!typeName || typeof typeName !== "string") {
    return res.status(400).json({
      success: false,
      message: "Room type name is required",
    });
  }

  const roomType = await RoomType.create({
    typeName: typeName.trim(),
    status: status || "active",
  });

  res.status(201).json({
    success: true,
    data: roomType,
  });
});

// @desc    Get all room types
// @route   GET /api/room-types
// @access  Public

exports.getAllRoomTypes = asyncHandler(async (req, res) => {
  const roomTypes = await RoomType.find();

  res.status(200).json({
    success: true,
    data: roomTypes,
  });
});

// @desc    Get a single room type by ID
// @route   GET /api/room-types/:id
// @access  Public

exports.getRoomTypeById = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findById(req.params.id);

  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: "Room type not found",
    });
  }

  res.status(200).json({
    success: true,
    data: roomType,
  });
});

// @desc    Update room type
// @route   PUT /api/room-types/:id
// @access  Private (Admin)

exports.updateRoomType = asyncHandler(async (req, res) => {
  const { typeName, status } = req.body;

  const roomType = await RoomType.findByIdAndUpdate(
    req.params.id,
    {
      ...(typeName && { typeName }),
      ...(status && { status }),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: "Room type not found",
    });
  }

  res.status(200).json({
    success: true,
    data: roomType,
  });
});

// @desc    Delete room type
// @route   DELETE /api/room-types/:id
// @access  Private (Admin)

exports.deleteRoomType = asyncHandler(async (req, res) => {
  const roomType = await RoomType.findById(req.params.id);

  if (!roomType) {
    return res.status(404).json({
      success: false,
      message: "Room type not found",
    });
  }

  await roomType.deleteOne();

  res.status(200).json({
    success: true,
  });
});

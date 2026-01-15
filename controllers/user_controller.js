const asyncHandler = require("../middleware/async");
const User = require("../models/user_model");
const path = require("path");
const fs = require("fs");

// @desc    Create a new user
// @route   POST /api/users
// @access  Public

exports.createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, profilePicture } = req.body;

  console.log("Creating user with name:", fullName);

  // Check if the email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // Create the user
  const user = await User.create({
    fullName,
    email,
    password, // Password will be hashed automatically by the pre-save hook
    role,
    profilePicture: profilePicture || "default-profile.png",
  });

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    data: userResponse,
  });
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public

exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide an email and password" });
  }

  // Check if user exists
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get all users
// @route   GET /api/users
// @access  Public

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get a user by ID
// @route   GET /api/users/:id
// @access  Public

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, profilePicture } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Authorization check: Make sure user is updating their own profile
  if (user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "Not authorized to update this user profile"
    });
  }

  // Update the student fields
  user.fullName = fullName || user.fullName;
  user.email = email || user.email;
  user.role = role || user.role;
  user.profilePicture = profilePicture || user.profilePicture;

  // Only update password if provided (will be hashed by pre-save hook)
  if (password) {
    user.password = password;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Authorization check: Make sure user is deleting their own profile
  if (user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "Not authorized to delete this user profile"
    });
  }

  // Remove the user's profile picture if it exists
  if (
    user.profilePicture &&
    user.profilePicture !== "default-profile.png"
  ) {
    const profilePicturePath = path.join(
      __dirname,
      "../public/profile_pictures",
      user.profilePicture
    );
    if (fs.existsSync(profilePicturePath)) {
      fs.unlinkSync(profilePicturePath);
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// @desc Upload Single Image
// @route POST /api/v1/auth/upload
// @access Private

exports.uploadProfilePicture = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send({ message: "Please upload a file" });
  }

  // Check for the file size and send an error message
  if (req.file.size > process.env.MAX_FILE_UPLOAD) {
    return res.status(400).send({
      message: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD} bytes`,
    });
  }

  res.status(200).json({
    success: true,
    data: req.file.filename,
  });
});

// Get token from model , create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    //Cookie will expire in 30 days
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Cookie security is false .if you want https then use this code. do not use in development time
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  //we have created a cookie with a token

  // Remove password from user object
  const userResponse = user.toObject();
  delete userResponse.password;

  res
    .status(statusCode)
    .cookie("token", token, options) // key , value ,options
    .json({
      success: true,
      token,
      data: userResponse,
    });
};

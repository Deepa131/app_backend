const mongoose = require("mongoose");

const addRoomSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assuming you have a User collection
      required: [true, "Owner ID is required"],
    },
    ownerContactNumber: {
      type: String,
      required: [true, "Owner contact number is required"],
      trim: true,
    },
    roomTitle: {
      type: String,
      required: [true, "Room title is required"],
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: [true, "Monthly price is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType", // link to room type collection
      required: [true, "Room type is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    videos: [
      {
        type: String,
        trim: true,
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true, // createdAt and updatedAt automatically
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

module.exports = mongoose.model("AddRoom", addRoomSchema);

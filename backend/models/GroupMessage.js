
const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null,
    },

    mediaKey: {
      type: String,
      default: "",
    },

    mediaUrl: {
      type: String,
      default: "",
    },

    mediaName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("GroupMessage", groupMessageSchema);

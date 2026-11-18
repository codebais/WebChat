
const express = require("express");
const mongoose = require("mongoose");

const Group = require("../models/Group");
const User = require("../models/User");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { name, members } = req.body;

    const groupName = name?.trim();

    if (!groupName) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    if (groupName.length > 50) {
      return res.status(400).json({
        message: "Group name cannot exceed 50 characters",
      });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        message: "Select at least one member",
      });
    }

    const adminId = req.user._id.toString();

    const memberIds = [
      ...new Set(members.map((id) => id.toString())),
    ].filter((id) => id !== adminId);

    if (memberIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one other member",
      });
    }

    const invalidId = memberIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidId) {
      return res.status(400).json({
        message: "One or more member IDs are invalid",
      });
    }

    const existingUsers = await User.find({
      _id: { $in: memberIds },
    }).select("_id");

    if (existingUsers.length !== memberIds.length) {
      return res.status(400).json({
        message: "One or more selected users do not exist",
      });
    }

    const acceptedConnections = await ConnectionRequest.find({
      status: "accepted",
      $or: [
        {
          sender: req.user._id,
          receiver: { $in: memberIds },
        },
        {
          receiver: req.user._id,
          sender: { $in: memberIds },
        },
      ],
    }).select("sender receiver");

    const acceptedIds = new Set();

    acceptedConnections.forEach((connection) => {
      const senderId = connection.sender.toString();
      const receiverId = connection.receiver.toString();

      acceptedIds.add(
        senderId === adminId ? receiverId : senderId
      );
    });

    const allConnected = memberIds.every((id) =>
      acceptedIds.has(id)
    );

    if (!allConnected) {
      return res.status(403).json({
        message: "You can only add accepted connections to a group",
      });
    }

    const group = await Group.create({
      name: groupName,
      admin: req.user._id,
      members: [req.user._id, ...memberIds],
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "name username profilePicture")
      .populate("members", "name username profilePicture");

    const io = req.app.get("io");

    if (io) {
      populatedGroup.members.forEach((member) => {
        io.to(`user:${member._id}`).emit(
          "new_group",
          populatedGroup
        );
      });
    }

    return res.status(201).json({
      message: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("Create group error:", error);

    return res.status(500).json({
      message: "Failed to create group",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
    })
      .populate("admin", "name username profilePicture")
      .populate("members", "name username profilePicture")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      groups,
    });
  } catch (error) {
    console.error("Fetch groups error:", error);

    return res.status(500).json({
      message: "Failed to fetch groups",
    });
  }
});

module.exports = router;

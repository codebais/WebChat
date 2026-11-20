const express = require("express");
const mongoose = require("mongoose");

const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/User");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const wasabi = require("../config/wasabi");

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const compressImage = require("../utils/compressImage");
const compressVideo = require("../utils/compressVideo");
router.use(authMiddleware);

const uploadFolder = path.join(__dirname, "../uploads/temp");

fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `${crypto.randomUUID()}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP and video files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

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

    const memberIds = [...new Set(members.map((id) => id.toString()))].filter(
      (id) => id !== adminId,
    );

    if (memberIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one other member",
      });
    }

    const invalidId = memberIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id),
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

      acceptedIds.add(senderId === adminId ? receiverId : senderId);
    });

    const allConnected = memberIds.every((id) => acceptedIds.has(id));

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
        io.to(`user:${member._id}`).emit("new_group", populatedGroup);
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

router.get("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    const group = await Group.findOne({
      _id: groupId,
      members: req.user._id,
    });

    if (!group) {
      return res.status(404).json({
        message: "Group not found or access denied",
      });
    }

    const messages = await GroupMessage.find({
      group: groupId,
    })
      .populate("sender", "name username profilePicture")
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Fetch group messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch group messages",
    });
  }
});


router.post("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const text = req.body.text?.trim();

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }

    if (!text) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        message: "Message cannot exceed 5000 characters",
      });
    }

    const group = await Group.findOne({
      _id: groupId,
      members: req.user._id,
    });

    if (!group) {
      return res.status(404).json({
        message: "Group not found or access denied",
      });
    }

    const message = await GroupMessage.create({
      group: groupId,
      sender: req.user._id,
      text,
    });

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate("sender", "name username profilePicture");

    const io = req.app.get("io");

    if (io) {
      group.members.forEach((memberId) => {
        io.to(`user:${memberId.toString()}`).emit(
          "new_group_message",
          populatedMessage
        );
      });
    }

    return res.status(201).json({
      message: "Group message sent successfully",
      groupMessage: populatedMessage,
    });
  } catch (error) {
    console.error("Send group message error:", error);

    return res.status(500).json({
      message: "Failed to send group message",
    });
  }
});

router.post("/:groupId/upload", (req, res) => {
  upload.single("media")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        message:
          uploadError.code === "LIMIT_FILE_SIZE"
            ? "File size must not exceed 50 MB."
            : uploadError.message,
      });
    }

    let uploadedPath = req.file?.path;
    let compressedPath = null;
    let wasabiKey = null;

    try {
      const { groupId } = req.params;
      const myId = req.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({
          message: "Invalid group ID.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a photo or video.",
        });
      }

      const group = await Group.findOne({
        _id: groupId,
        members: myId,
      });

      if (!group) {
        return res.status(403).json({
          message: "You are not a member of this group.",
        });
      }

      const isImage = req.file.mimetype.startsWith("image/");
      const mediaType = isImage ? "image" : "video";
      const extension = isImage ? ".webp" : ".mp4";

      compressedPath = path.join(
        uploadFolder,
        `${crypto.randomUUID()}${extension}`
      );

      if (isImage) {
        await compressImage(uploadedPath, compressedPath);
      } else {
        await compressVideo(uploadedPath, compressedPath);
      }

      wasabiKey = `media/group-${mediaType}s/${crypto.randomUUID()}${extension}`;

      const contentType = isImage ? "image/webp" : "video/mp4";

      await wasabi.send(
        new PutObjectCommand({
          Bucket: process.env.WASABI_BUCKET,
          Key: wasabiKey,
          Body: fs.createReadStream(compressedPath),
          ContentType: contentType,
        })
      );

      const groupMessage = await GroupMessage.create({
        group: groupId,
        sender: myId,
        text: "",
        mediaType,
        mediaKey: wasabiKey,
        mediaUrl: "",
        mediaName: req.file.originalname,
      });

      const populatedMessage = await GroupMessage.findById(groupMessage._id)
        .populate("sender", "name username profilePicture")
        .populate("group", "name members");

      const io = req.app.get("io");

      group.members.forEach((memberId) => {
        io.to(`user:${memberId.toString()}`).emit(
          "new_group_message",
          populatedMessage
        );
      });

      return res.status(201).json({
        message: "Group media sent successfully.",
        groupMessage: populatedMessage,
      });
    } catch (error) {
      console.error("Group media upload error:", error);

      if (wasabiKey) {
        try {
          await wasabi.send(
            new DeleteObjectCommand({
              Bucket: process.env.WASABI_BUCKET,
              Key: wasabiKey,
            })
          );
        } catch (deleteError) {
          console.error("Wasabi cleanup error:", deleteError.message);
        }
      }

      return res.status(500).json({
        message: "Failed to upload group media.",
      });
    } finally {
      for (const filePath of [uploadedPath, compressedPath]) {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error(
              "Temporary file cleanup error:",
              cleanupError.message
            );
          }
        }
      }
    }
  });
});

router.get("/media/:messageId/url", async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    const message = await GroupMessage.findById(messageId);

    if (!message || !message.mediaKey) {
      return res.status(404).json({
        message: "Group media not found.",
      });
    }

    const group = await Group.findOne({
      _id: message.group,
      members: myId,
    });

    if (!group) {
      return res.status(403).json({
        message: "You are not allowed to access this media.",
      });
    }

    const isImage = message.mediaType === "image";
    const extension = isImage ? "webp" : "mp4";
    const contentType = isImage ? "image/webp" : "video/mp4";

    const command = new GetObjectCommand({
      Bucket: process.env.WASABI_BUCKET,
      Key: message.mediaKey,
      ResponseContentType: contentType,
      ResponseContentDisposition: `inline; filename="media.${extension}"`,
    });

    const signedUrl = await getSignedUrl(wasabi, command, {
      expiresIn: 300,
    });

    return res.status(200).json({
      mediaUrl: signedUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Group media URL error:", error);

    return res.status(500).json({
      message: "Failed to generate group media URL.",
    });
  }
});

module.exports = router;

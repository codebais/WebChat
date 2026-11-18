const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const wasabi = require("../config/wasabi");

const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const compressImage = require("../utils/compressImage");
const compressVideo = require("../utils/compressVideo");
const Message = require("../models/message");
const ConnectionRequest = require("../models/ConnectionRequest");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);


const uploadFolder = path.join(__dirname, "../uploads/temp");

fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
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

router.post("/upload/:receiverId", (req, res) => {
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
      const { receiverId } = req.params;
      const myId = req.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({
          message: "Invalid receiver ID.",
        });
      }

      if (receiverId === myId) {
        return res.status(400).json({
          message: "You cannot send media to yourself.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please select a photo or video.",
        });
      }

      const connection = await ConnectionRequest.findOne({
        status: "accepted",
        $or: [
          { sender: myId, receiver: receiverId },
          { sender: receiverId, receiver: myId },
        ],
      });

      if (!connection) {
        return res.status(403).json({
          message: "You are not connected with this user.",
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

      wasabiKey = `media/${mediaType}s/${crypto.randomUUID()}${extension}`;

      const contentType = isImage ? "image/webp" : "video/mp4";

      await wasabi.send(
        new PutObjectCommand({
          Bucket: process.env.WASABI_BUCKET,
          Key: wasabiKey,
          Body: fs.createReadStream(compressedPath),
          ContentType: contentType,
        })
      );

      const message = await Message.create({
        sender: myId,
        receiver: receiverId,
        text: "",
        mediaType,
        mediaKey: wasabiKey,
        mediaUrl: "",
        mediaName: req.file.originalname,
        isRead: false,
      });

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name username profilePicture")
        .populate("receiver", "name username profilePicture");

      const io = req.app.get("io");

      io.to(`user:${myId}`).emit("new_message", populatedMessage);
      io.to(`user:${receiverId}`).emit("new_message", populatedMessage);

      return res.status(201).json({
        message: "Media sent successfully.",
        mediaMessage: populatedMessage,
      });
    } catch (error) {
      console.error("Media upload error:", error);

      if (wasabiKey) {
        try {
          const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

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
        message: "Failed to upload media.",
      });
    } finally {
      for (const filePath of [uploadedPath, compressedPath]) {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error("Temporary file cleanup error:", cleanupError.message);
          }
        }
      }
    }
  });
});


// router.post("/upload/:receiverId", (req, res) => {
//   upload.single("media")(req, res, async (uploadError) => {
//     if (uploadError) {
//       return res.status(400).json({
//         message:
//           uploadError.code === "LIMIT_FILE_SIZE"
//             ? "File size must not exceed 50 MB."
//             : uploadError.message,
//       });
//     }

//     let uploadedPath = req.file?.path;

//     try {
//       const { receiverId } = req.params;
//       const myId = req.user._id.toString();

//       if (!mongoose.Types.ObjectId.isValid(receiverId)) {
//         if (uploadedPath) fs.unlinkSync(uploadedPath);

//         return res.status(400).json({
//           message: "Invalid receiver ID.",
//         });
//       }

//       if (receiverId === myId) {
//         if (uploadedPath) fs.unlinkSync(uploadedPath);

//         return res.status(400).json({
//           message: "You cannot send media to yourself.",
//         });
//       }

//       if (!req.file) {
//         return res.status(400).json({
//           message: "Please select a photo or video.",
//         });
//       }

//       const connection = await ConnectionRequest.findOne({
//         status: "accepted",
//         $or: [
//           { sender: myId, receiver: receiverId },
//           { sender: receiverId, receiver: myId },
//         ],
//       });

//       if (!connection) {
//         fs.unlinkSync(uploadedPath);

//         return res.status(403).json({
//           message: "You are not connected with this user.",
//         });
//       }

//       const mediaType = req.file.mimetype.startsWith("image/")
//         ? "image"
//         : "video";

//       const message = await Message.create({
//         sender: myId,
//         receiver: receiverId,
//         text: "",
//         mediaType,
//         mediaUrl: `/uploads/chat/${req.file.filename}`,
//         mediaName: req.file.originalname,
//         isRead: false,
//       });

//       const populatedMessage = await Message.findById(message._id)
//         .populate("sender", "name username profilePicture")
//         .populate("receiver", "name username profilePicture");

//       const io = req.app.get("io");

//       io.to(`user:${myId}`).emit("new_message", populatedMessage);
//       io.to(`user:${receiverId}`).emit("new_message", populatedMessage);

//       res.status(201).json({
//         message: "Media sent successfully.",
//         mediaMessage: populatedMessage,
//       });
//     } catch (error) {
//       console.error("Media upload error:", error);

//       if (uploadedPath && fs.existsSync(uploadedPath)) {
//         fs.unlinkSync(uploadedPath);
//       }

//       res.status(500).json({
//         message: "Failed to upload media.",
//       });
//     }
//   });
// });


router.get("/media/:messageId/url", async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        message: "Invalid message ID.",
      });
    }

    // Find the message
    const message = await Message.findById(messageId);

    if (!message || !message.mediaKey) {
      return res.status(404).json({
        message: "Media not found.",
      });
    }

    const isParticipant =
      message.sender.toString() === myId ||
      message.receiver.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not allowed to access this media.",
      });
    }

    const connection = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        {
          sender: message.sender,
          receiver: message.receiver,
        },
        {
          sender: message.receiver,
          receiver: message.sender,
        },
      ],
    });

    if (!connection) {
      return res.status(403).json({
        message: "You are not connected with this user.",
      });
    }

    const extension = message.mediaType === "image" ? "webp" : "mp4";

    const contentType =
      message.mediaType === "image" ? "image/webp" : "video/mp4";

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
    console.error("Media URL error:", error);

    return res.status(500).json({
      message: "Failed to generate media URL.",
    });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const connection = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });

    if (!connection) {
      return res.status(403).json({
        message: "You are not connected with this user.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .populate("sender", "name username profilePicture")
      .populate("receiver", "name username profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Fetch messages error:", error);

    res.status(500).json({
      message: "Failed to fetch messages.",
    });
  }
});

module.exports = router;

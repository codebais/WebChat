
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      ffmpegPath,
      [
        "-i", inputPath,
        "-vf", "scale='min(1280,iw)':-2",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-y",
        outputPath,
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error("Video compression failed:", stderr);
          return reject(error);
        }

        console.log("Video compressed successfully!");
        resolve(outputPath);
      }
    );
  });
}

module.exports = compressVideo;

import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app = express();
app.use(cors());          // Allow frontend to call backend
app.use(express.json());  // Parse JSON request bodies

// Runware setup
const RUNWARE_API_BASE = "https://api.runware.ai/v1";
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;
const PORT = process.env.PORT || 5000;

// Exit if API key missing
if (!RUNWARE_API_KEY) {
  console.error("Missing RUNWARE_API_KEY in environment");
  process.exit(1);
}

// Helper to send tasks to Runware
async function sendTasks(tasks) {
  const resp = await axios.post(`${RUNWARE_API_BASE}/inference`, tasks, {
    headers: {
      Authorization: `Bearer ${RUNWARE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  return resp.data;
}

// Image Generation
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    const taskUUID = uuidv4();

    // Define image generation task
    const tasks = [
      {
        taskType: "imageInference",
        taskUUID,
        positivePrompt: prompt,
        model: "runware:101@1",   // Default model
        width: 512,
        height: 512,
        steps: 30,
        CFGScale: 7.5,
        numberResults: 1,
        outputType: "URL",       // Return image as URL
        outputFormat: "jpg",
        outputQuality: 95,
        includeCost: true,       // Return cost
      },
    ];

    const runwareResp = await sendTasks(tasks);
    const result = runwareResp.data?.[0];

    res.json({
      imageURL: result?.imageURL,
      cost: result?.cost,
    });
  } catch (err) {
    console.error("Image generation error:", err.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

// Video Generation
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt } = req.body;
    const taskUUID = uuidv4(); // locally generated

    const tasks = [
      {
        taskType: "videoInference",
        taskUUID,
        positivePrompt: prompt,
        model: "klingai:5@3",
        duration: 5,
        width: 1920,
        height: 1080,
        numberResults: 1,
        outputFormat: "mp4",
        outputType: "URL",
        outputQuality: 95,
        includeCost: true,
        deliveryMethod: "async",
      },
    ];

    const runwareResp = await sendTasks(tasks);
    const result = runwareResp.data?.[0];

    res.json({
      taskUUID: result?.taskUUID,
      status: result?.status,
      cost: result?.cost,
    });
  } catch (err) {
    console.error(" Video generation error:", err.response?.data || err.message);
    res.status(500).json({ error: "Video generation failed" });
  }
});

// Video Status Polling
app.post("/api/video-status", async (req, res) => {
  try {
    const { taskUUID } = req.body;

    const tasks = [
      {
        taskType: "getResponse",
        taskUUID,
      },
    ];

    const runwareResp = await sendTasks(tasks);
    const result = runwareResp.data?.[0];

    res.json({
      status: result?.status,
      videoURL: result?.videoURL,
      cost: result?.cost,
    });
  } catch (err) {
    console.error("Video status error:", err.response?.data || err.message);
    res.status(500).json({ error: "Error fetching video status" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

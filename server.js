const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Cloudinary Setup using Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. MongoDB Database Connection using Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected to AZ database'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Database Schema
const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MediaModel = mongoose.model('AZ', MediaSchema, 'AZ');

// Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API Endpoint for Video/Audio Upload
app.post('/api/upload-media', upload.single('mediaFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file received' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'recordings' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary Error:', error);
          return res.status(500).json({ success: false, error: error.message });
        }

        const newRecord = new MediaModel({ url: result.secure_url });
        await newRecord.save();
        console.log('✅ Saved to Cloudinary & DB:', result.secure_url);

        return res.status(200).json({ success: true, url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

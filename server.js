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

// =========================================================
// 1. CLOUDINARY CONFIGURATION (Apni Details Yahan Bharein)
// =========================================================
cloudinary.config({
  cloud_name: 'pfmjg7ip', // e.g. 'dt1xyz'
  api_key: '368463435529631',       // e.g. '1234567890'
  api_secret: '6u7lnfIRo4ikkXSR_GM2ziUtStM'  // e.g. 'abcde_12345'
});

// =========================================================
// 2. MONGODB DATABASE CONNECTION (Apna URL Yahan Bharein)
// =========================================================
const MONGODB_URI = 'mongodb+srv://pawandevprasad1_db_user:12345@cluster0.acobnxp.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected to database'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// MongoDB Schema Definition
const MediaSchema = new mongoose.Schema({
  cloudinaryUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  resourceType: { type: String, default: 'video' },
  createdAt: { type: Date, default: Date.now }
});

const MediaModel = mongoose.model('Media', MediaSchema);

// Multer Storage Configuration (In-Memory Upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// =========================================================
// 3. API UPLOAD ENDPOINT
// =========================================================
app.post('/api/upload-media', upload.single('mediaFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file received' });
    }

    // Stream Buffer Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'recordings' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary Error:', error);
          return res.status(500).json({ success: false, error: error.message });
        }

        // Save Metadata to MongoDB Database
        const newRecord = new MediaModel({
          cloudinaryUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type
        });

        await newRecord.save();
        console.log('✅ File saved to Cloudinary & DB:', result.secure_url);

        return res.status(200).json({
          success: true,
          message: 'Uploaded & Saved Successfully',
          url: result.secure_url
        });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve Main Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Port Binding for Render/Localhost
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

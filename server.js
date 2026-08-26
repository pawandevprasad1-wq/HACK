const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));
app.use(express.json());

// Direct MongoDB Connection String (AZ Database)
const MONGODB_URI = "mongodb+srv://pawandevprasad1_db_user:12345@cluster0.acobnxp.mongodb.net/AZ?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected to AZ database'))
  .catch(err => console.error('MongoDB Error:', err));

// MongoDB Schema
const AudioSchema = new mongoose.Schema({
  audioUrl: String,
  createdAt: { type: Date, default: Date.now }
});
const AudioModel = mongoose.model('AZ', AudioSchema, 'AZ');

// Direct Cloudinary Config
cloudinary.config({
  cloud_name: 'pfmjg7ip',
  api_key: '368463435529631',
  api_secret: '6u7lnfIRo4ikkXSR_GM2ziUtStM'
});

// Upload API Endpoint
app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio provided' });

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'audio_recordings' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ error: error.message });
        }

        // Save URL in MongoDB collection 'AZ'
        const newRecord = new AudioModel({ audioUrl: result.secure_url });
        await newRecord.save();

        console.log('Successfully saved to MongoDB:', result.secure_url);
        res.json({ success: true, url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Render dynamic port selection
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure with your cloud storage provider
const storage = new Storage({
  keyFilename: path.join(__dirname, '../../config/cloud-storage-credentials.json')
});
const bucket = storage.bucket(process.env.STORAGE_BUCKET_NAME);

exports.uploadToCloudStorage = async (file, destinationPath) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const fullPath = `${destinationPath}/${filename}`;
    
    const blob = bucket.file(fullPath);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', err => {
      console.error('Upload error:', err);
      reject(err);
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};
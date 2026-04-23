const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

// Use memory storage for cloud uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WebP, and AVIF images are allowed.'));
    }
    cb(null, true);
  },
});

/**
 * Uploads a file buffer to Supabase Storage
 * @param {Object} file - The file object from multer (buffer, originalname, mimetype)
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
const uploadToCloud = async (file) => {
  if (!supabase) {
    throw new Error('Supabase cloud storage is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env');
  }

  const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(uniqueName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload image to cloud: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return publicUrl;
};

/**
 * Deletes a file from Supabase Storage
 * @param {string} url - The public URL of the file to delete
 */
const deleteFromCloud = async (url) => {
  if (!supabase || !url) return;
  
  // Only attempt to delete if it's a supabase storage URL
  if (!url.includes('supabase.co/storage/v1/object/public/product-images/')) return;

  const fileName = url.split('/').pop();
  
  const { error } = await supabase.storage
    .from('product-images')
    .remove([fileName]);

  if (error) {
    console.error('Supabase deletion error:', error);
  }
};

module.exports = { upload, uploadToCloud, deleteFromCloud };

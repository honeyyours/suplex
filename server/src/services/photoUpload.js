const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return false;
  }
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
  return true;
}

function isConfigured() {
  return ensureConfigured();
}

// Buffer를 Cloudinary에 업로드. folder 지정 가능.
async function uploadBuffer(buffer, { folder = 'suplex', filename } = {}) {
  if (!ensureConfigured()) {
    const err = new Error('Cloudinary가 설정되지 않았습니다. 서버 .env의 CLOUDINARY_* 키를 설정하세요');
    err.status = 503;
    throw err;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
        // 자동 포맷 최적화
        eager: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto', quality: 'auto' }],
        eager_async: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          thumbnailUrl: result.eager?.[0]?.secure_url || null,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

async function deleteByPublicId(publicId) {
  if (!ensureConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    // 삭제 실패는 무시 (Cloudinary에 먼저 사라진 경우 대비)
  }
}

module.exports = { uploadBuffer, deleteByPublicId, isConfigured };

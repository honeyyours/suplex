require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key} — check your .env file`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  solapi: {
    apiKey: process.env.SOLAPI_API_KEY || '',
    apiSecret: process.env.SOLAPI_API_SECRET || '',
    sender: process.env.SOLAPI_SENDER || '',
    pfId: process.env.SOLAPI_PFID || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

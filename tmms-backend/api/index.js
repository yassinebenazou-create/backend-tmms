const dotenv = require('dotenv');
const app = require('../app');
const { initDbAndSeed } = require('../utils/connectDb');

dotenv.config();

module.exports = async (req, res) => {
  try {
    await initDbAndSeed();
    return app(req, res);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Vercel handler init error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize server.'
    });
  }
};

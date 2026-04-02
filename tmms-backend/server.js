const dotenv = require('dotenv');
const app = require('./app');
const { initDbAndSeed } = require('./utils/connectDb');

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDbAndSeed();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`TMMS backend listening on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

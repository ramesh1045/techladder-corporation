require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`[server] TechLadder backend running on port ${PORT}`);
  });
})();

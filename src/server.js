const express = require('express');
const routes = require('./routes');
const { pool, redis } = require('./db');

const app = express();
app.use(express.json());

// Routes
app.use('/', routes);

const PORT = process.env.PORT || 3000;

// Only start the server if not in test mode
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

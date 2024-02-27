const cors = require('cors');
const express = require('express');
const path = require('path');
const app = express();

// Setting up CORS
const allowedOrigins = ['https://traces-cyatz.ondigitalocean.app/', 'https://traces.site'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins if '*' is present in allowedOrigins
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Check against allowedOrigins list
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Serve static files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoint to provide environment variables
// app.get('/api/get-env-vars', (req, res) => {
//   res.json({
//       key: process.env.VALUE
//     });
// });

// Start server
app.listen(process.env.PORT || 8080, () => {
  console.log('Server is running');
});
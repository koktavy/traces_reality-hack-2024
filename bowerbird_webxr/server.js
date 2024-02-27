const cors = require('cors');
const express = require('express');
const path = require('path');
const app = express();

// Setting up CORS
const allowedOrigins = ['*', 'https://traces-cyatz.ondigitalocean.app/', 'https://traces.site'];
app.use(
  cors({
    origin: function(origin, callback){
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        var msg = 'Origin not allowed';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    }
  })
);

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
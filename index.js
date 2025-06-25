const express = require('express'); 
const axios = require('axios'); 
const bodyParser = require('body-parser'); 
const qs = require('qs'); 
const app = express(); 

app.use(bodyParser.json()); 

 
 

// Health check route
app.get('/', (req, res) => {
  res.send('Webhook server is live and running!');
});

// Required for Render deployment
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('process.env.PORT is not defined. Render needs it to expose the service.');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

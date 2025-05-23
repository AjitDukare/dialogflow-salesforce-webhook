const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


const SF_LOGIN_URL = 'https://login.salesforce.com';
const CLIENT_ID = '3MVG9GCMQoQ6rpzSn4.KKeYwDDDvP_3LKd6BxVAVq3Ml32.YUF3x7_7E5fv4BiHXdRWu_JdhvFmxkcIbwE5ke';
const CLIENT_SECRET = 'B0141FAEE2690156A27C506D62782F59C9DF4518B3F5FE3C92CED7741E33D95B';
const USERNAME = 'ajitdukare@nandupg.com';
const PASSWORD = 'Ajit1997@@qV3x65Shz8ow4m2GMezK32MZf';

let accessToken = '';
let instanceUrl = '';


async function authenticateWithSalesforce() {
  const response = await axios.post(`${SF_LOGIN_URL}/services/oauth2/token`, null, {
    params: {
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: USERNAME,
      password: PASSWORD
    }
  });

  accessToken = response.data.access_token;
  instanceUrl = response.data.instance_url;
}


async function createLead(data) {
  const leadData = {
    FirstName: data.name.split(' ')[0],
    LastName: data.name.split(' ').slice(1).join(' ') || 'Demo',
    Company: 'Demo Booking',
    Email: data.email,
    Phone: data.phone,
    Description: `Demo requested for ${data.date}`
  };

  const response = await axios.post(
    `${instanceUrl}/services/data/v58.0/sobjects/Lead/`,
    leadData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}
app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});


app.post('/webhook', async (req, res) => {
  const params = req.body.queryResult?.parameters;
  console.log("🌐 Received Dialogflow request:", JSON.stringify(req.body, null, 2));

  try {
    if (!accessToken) {
      console.log("🔐 Authenticating with Salesforce...");
      await authenticateWithSalesforce();
      console.log("✅ Auth success");
    }

    console.log("📥 Creating lead with params:", params);
    await createLead(params);
    console.log("✅ Lead created");

    res.json({
      fulfillmentText: `Thanks ${params.name}, your demo is scheduled for ${params.date}. We'll contact you soon!`
    });

  } catch (error) {
    console.error('🔥 Error:', error.response ? error.response.data : error.message);
    res.json({
      fulfillmentText: 'Something went wrong. Please try again later.'
    });
  }
});


const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("❌ process.env.PORT is not defined. Render needs it to expose the service.");
}

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});


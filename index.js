const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


const SF_LOGIN_URL = 'https://login.salesforce.com';
const CLIENT_ID = '3MVG9GCMQoQ6rpzSn4.KKeYwDDMPwPmoYvIPRK6rFT_3gSW9OefVYigvvjh7ZJIr6mP8YyMzxkpM6j9IECokS';
const CLIENT_SECRET = 'B98C05B4A353E32ACFB2BA82CB12489EB4101DFE69E7B17B379C0EFD61C762B9';
const USERNAME = 'ajitdukare@nandupg.com';
const PASSWORD = 'Ajit1997@@22YDfiEcQkMus1dYKLBs0CgFf';

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
  console.log('Received from Dialogflow:', req.body.queryResult.parameters);
});


app.post('/webhook', async (req, res) => {
  const params = req.body.queryResult?.parameters;
  console.log("🌐 Received Dialogflow request:", JSON.stringify(req.body, null, 2));
  console.log('Received from Dialogflow:', req.body.queryResult.parameters);

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


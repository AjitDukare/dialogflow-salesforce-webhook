const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


const SF_LOGIN_URL = 'https://login.salesforce.com';
const CLIENT_ID = 'your_client_id';
const CLIENT_SECRET = 'your_client_secret';
const USERNAME = 'your_salesforce_username';
const PASSWORD = 'your_salesforce_password_and_security_token'; // example: 'myPassword123TOKEN'

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

app.post('/webhook', async (req, res) => {
  const params = req.body.queryResult.parameters;

  try {
    if (!accessToken) {
      await authenticateWithSalesforce();
    }

    await createLead(params);

    res.json({
      fulfillmentText: `Thanks ${params.name}, your demo is scheduled for ${params.date}. We'll contact you soon!`
    });

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.json({
      fulfillmentText: 'Something went wrong. Please try again later.'
    });
  }
});

// 🚀 Start the Webhook Server
app.listen(3000, () => {
  console.log('Webhook running on http://localhost:3000');
});

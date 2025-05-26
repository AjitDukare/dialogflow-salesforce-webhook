const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const SF_LOGIN_URL = 'https://login.salesforce.com';
const CLIENT_ID = '3MVG9GCMQoQ6rpzSn4.KKeYwDDNojuQ98hCibJ3PurCg83ej_hka1_IzEMlzwGB9P9Hx5EuOBaggHSXZblk.k';
const CLIENT_SECRET = '0AD980F32A557EE511527FDCD1E40C6D2A4219575ACB08374DA12F6E345E6BAF';
const USERNAME = 'ajitdukare@nandupg.com';
const PASSWORD = 'Ajit1997@@eQHbjKVXFQ67nd9xbA7sWisw';

let accessToken = '';
let instanceUrl = '';


async function authenticateWithSalesforce() {
  try {
    console.log('Starting Salesforce authentication...');
    console.log('CLIENT_ID:', CLIENT_ID);
    console.log('CLIENT_SECRET:', CLIENT_SECRET);
    console.log('USERNAME:', USERNAME);
    console.log('PASSWORD:', PASSWORD);

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
    console.log('accessToken is :', accessToken);
    console.log('instanceUrl is :', instanceUrl);

    console.log('Authenticated successfully!');
    console.log('Access Token:', accessToken ? accessToken.slice(0, 10) + '... (masked)' : 'Not received');
    console.log('Instance URL:', instanceUrl);
  } catch (err) {
    console.error('Authentication failed!');
    console.error('Request sent to:', `${SF_LOGIN_URL}/services/oauth2/token`);
    console.error('Params:', {
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: USERNAME,
      password: PASSWORD
    });
    console.error('Error response new:', err.response?.data || err.message);
    throw err;
  }
}

async function createLead(data) {
  console.log('Creating Lead with data:', data);

  const leadData = {
    FirstName: data.name.split(' ')[0],
    LastName: data.name.split(' ').slice(1).join(' ') || 'Demo',
    Company: 'Demo Booking',
    Email: data.email,
    Phone: data.phone,
    Description: `Demo requested for ${data.date}`
  };

  console.log('Payload to Salesforce:', leadData);

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

  console.log('Lead created successfully:', response.data);
  return response.data;
}

app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});


app.post('/webhook', async (req, res) => {
  const params = req.body.queryResult?.parameters;
  console.log('Received Dialogflow request new:', JSON.stringify(req.body, null, 2));
  

  try {
    if (!accessToken) {
       console.log('accessToken is new :', accessToken);
      console.log('No access token found. Authenticating...');
      await authenticateWithSalesforce();
      console.log('Auth success');
    } else {
      console.log('Reusing existing access token.');
    }

    console.log('Creating lead with params:', params);
    await createLead(params);
    console.log('Lead creation completed');

    res.json({
      fulfillmentText: `Thanks ${params.name}, your demo is scheduled for ${params.date}. We'll contact you soon!`
    });

  } catch (error) {
    console.error('Error in /webhook handler:', error.response ? error.response.data : error.message);
    res.json({
      fulfillmentText: 'Something went wrong. Please try again later.'
    });
  }
});

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('process.env.PORT is not defined. Render needs it to expose the service.');
}

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
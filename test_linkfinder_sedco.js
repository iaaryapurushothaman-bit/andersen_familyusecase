const https = require('https');
require('dotenv').config();

function testLinkfinder() {
  const apiKey = process.env.VITE_LINKFINDER_API_KEY;
  const company = "SEDCO Holding";
  
  const options = {
    hostname: 'api.linkfinderai.com',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const reqWebsite = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => console.log('Linkfinder Website result:', data));
  });

  reqWebsite.write(JSON.stringify({
    type: "company_name_to_website",
    input_data: company
  }));
  reqWebsite.end();

  const reqEmployees = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => console.log('Linkfinder Employees result:', data));
  });

  reqEmployees.write(JSON.stringify({
    type: "company_name_to_employee_count",
    input_data: company
  }));
  reqEmployees.end();
}

testLinkfinder();

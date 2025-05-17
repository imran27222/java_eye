const Twilio = require("twilio");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNTSID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const sendSms = async (body) => {
  try {
    const response = await client.messages.create({
      body: body.message,
      to: body.number,
      from: process.env.TWILIO_NUMBER,
    });
    return { message: "sms has been sent" };
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = { sendSms };

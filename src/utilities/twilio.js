const Twilio = require("twilio");
require("dotenv").config();

const client = new Twilio(
  process.env.TWILIO_ACCOUNTSID,
  process.env.TWILIO_AUTH_TOKEN
);

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
    return { error: e.message };
  }
};

module.exports = { sendSms };

const {createClient} = require("redis");

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD
});


async function connectRedis() {
    try {
        await client.connect();
        console.log("Redis connected");
    } catch (error) {
        console.error("Error connecting to Redis:", error);
    }
}

async function setUserOtp(userId, otp) {
    try {
        await client.setEx(String(userId), 300, String(otp));
        console.log(`OTP set for user ${userId}`);
    } catch (error) {
        console.error(`Failed to set OTP for user ${userId}:`, error);
        throw error;
    }
}

async function getUserOtp(userId, enteredOtp) {
  try {
    const storedOtp = await client.get(String(userId));
    console.log(`OTP retrieved for user ${userId}:`, storedOtp);
    return storedOtp;
  } catch (error) {
    console.error(`Failed to retrieve OTP for user ${userId}:`, error);
    throw error;
  }
}

async function delOtp(userId) {
  try {
    const result = await client.del(userId);
    if (result === 1) {
      console.log(`OTP for user ${userId} deleted successfully`);
      return { success: true, message: "OTP deleted" };
    } else {
      console.log(`No OTP found for user ${userId} to delete`);
      return { success: false, message: "No OTP found" };
    }
  } catch (error) {
    console.error(`Failed to delete OTP for user ${userId}:`, error);
    throw error;
  }
}



module.exports = {connectRedis, setUserOtp, getUserOtp,delOtp}

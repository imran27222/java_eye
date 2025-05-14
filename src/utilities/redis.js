const redis = require("redis");
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
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
        await client.set(userId, JSON.stringify(otp));
        console.log(`OTP set for user ${userId}`);
    } catch (error) {
        console.error(`Failed to set OTP for user ${userId}:`, error);
        throw error;
    }
}

async function getUserOtp(userId, enteredOtp) {
  try {
    const storedOtp = await client.get(userId);
    console.log(`OTP retrieved for user ${userId}: ${storedOtp}`);

    if (!storedOtp) {
      console.log("OTP not found or expired");
      return { success: false, message: "OTP not found or expired" };
    }

    if (storedOtp === enteredOtp) {
      console.log("OTP matched successfully");
      return { success: true };
    } else {
      console.log("OTP did not match");
      return { success: false, message: "Invalid OTP" };
    }
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



module,exports = {connectRedis, setUserOtp, getUserOtp,delOtp}

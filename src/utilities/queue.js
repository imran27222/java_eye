const Queue = require("bull");
const { db } = require("./dbConnection");
const AuthModel = require("../model/auth.model");

const DELAY_TIME = 24 * 60 * 60 * 1000;
// const DELAY_TIME = 12 * 60 * 60 * 1000;

console.log("redis_info:", {
  host: process.env.REDIS_HOST, // Redis host
  port: process.env.REDIS_PORT, // Redis port
  password: process.env.REDIS_PASSWORD, // If Redis requires authentication
});
// Initialize the Bull queue
const walletQueue = new Queue("wallet-update", {
  redis: {
    host: process.env.REDIS_HOST, // Redis host
    port: process.env.REDIS_PORT, // Redis port
    password: process.env.REDIS_PASSWORD, // If Redis requires authentication
  },
});

walletQueue.on("ready", () => {
  console.log("Bull queue is ready and connected to Redis.");
});

walletQueue.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
});

// Add a job to the queue
async function addWalletUpdateJob(userId, purchaseObj) {
  const jobData = { userId, purchaseObj };

  await walletQueue.add(jobData, {
    delay: DELAY_TIME, // Delay of 24 hours
    attempts: 3, // Retry up to 3 times if the job fails
  });

  console.log(`Job added to update wallet for user ${userId} after 24 hours.`);
}

// Process jobs in the queue
walletQueue.process(async (job) => {
  const { userId, purchaseObj } = job.data;

  try {
    const user = await AuthModel.fetchUserById(userId);
    const currentWalletAmount = user[0].current_balance;

    const updatedWalletAmount = currentWalletAmount + purchaseObj.profited_amount;

    await db.query(`UPDATE users SET current_balance = ${updatedWalletAmount} WHERE id = ${userId}`);

    console.log(`Wallet updated successfully for user ${userId}: New amount = ${updatedWalletAmount}`);
  } catch (error) {
    console.error(`Failed to update wallet for user ${userId}:`, error);
    throw error;
  }
});

module.exports = {
  walletQueue,
  addWalletUpdateJob,
};

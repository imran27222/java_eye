const generateUniqueHash = (userId) => {
  const randomValue = Math.random().toString(36).substr(2, 6); // 6 random characters
  const timestamp = Date.now().toString(36).substr(-6); // Last 6 characters of the timestamp
  return (randomValue + timestamp).substr(0, 12); // Combine and trim to 12 characters
};

module.exports = { generateUniqueHash };

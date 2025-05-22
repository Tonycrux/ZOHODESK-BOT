const { getAccessToken } = require('./zoho/auth');

(async () => {
  const token = await getAccessToken();
  console.log("✅ Your access token is:", token);
})();

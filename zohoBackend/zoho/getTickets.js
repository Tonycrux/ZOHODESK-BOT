const axios = require("axios");
const { getAccessToken } = require("./auth");
require("dotenv").config();

const API_BASE = "https://desk.zoho.com/api/v1";

async function getAllTickets() {
  try {
    const accessToken = await getAccessToken();

    const res = await axios.get(`${API_BASE}/tickets`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        orgId: process.env.ORG_ID,
      },
      params: {
        include: "contacts,assignee,departments,team,isRead",
      },
    });

    console.log("📋 Tickets Fetched:", res.data.data.length);
    res.data.data.forEach((ticket, index) => {
      console.log(`${index + 1}. #${ticket.ticketNumber} - ${ticket.subject}`);
    });

  } catch (error) {
    console.error("❌ Failed to fetch tickets:", error.response?.data || error.message);
  }
}

getAllTickets();
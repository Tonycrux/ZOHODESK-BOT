const axios = require("axios");
const { getAccessToken } = require("../zoho/auth");
require("dotenv").config();

const API_BASE = "https://desk.zoho.com/api/v1";

exports.getAllTicketsFromZoho = async () => {
  const token = await getAccessToken();

  const response = await axios.get(`${API_BASE}/tickets`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      orgId: process.env.ORG_ID,
    },
    params: {
      include: "contacts",
    },
  });

  const rawTickets = response.data.data;

  const simplifiedTickets = rawTickets.map(ticket => ({
     id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    email: ticket.email || ticket.contact?.email || "N/A",
    webUrl: ticket.webUrl
  }));

  return simplifiedTickets;
};



exports.getFilteredTickets = async (status, limit, page) => {
  const token = await getAccessToken();

  const res = await axios.get(`${API_BASE}/tickets`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      orgId: process.env.ORG_ID,
    },
    params: {
      include: "contacts",
      limit: parseInt(limit),
      from: (page - 1) * limit,
      ...(status && { status })
    }
  });

  const rawTickets = res.data.data;

  return rawTickets.map(ticket => ({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    email: ticket.email || ticket.contact?.email || "N/A",
    webUrl: ticket.webUrl
  }));
};



exports.getTicketWithThreads = async (ticketId) => {
  const token = await getAccessToken();

  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    orgId: process.env.ORG_ID,
  };

  // Step 1: Fetch ticket metadata
  const ticketRes = await axios.get(`${API_BASE}/tickets/${ticketId}`, { headers });

  // Step 2: Fetch thread list
  const threadsListRes = await axios.get(`${API_BASE}/tickets/${ticketId}/threads`, { headers });

  const threadSummaries = threadsListRes.data.data;

  // Step 3: For each thread, get full content by threadId
  const fullThreads = await Promise.all(
  threadSummaries.map(async (thread) => {
    try {
      const threadDetailRes = await axios.get(
        `${API_BASE}/tickets/${ticketId}/threads/${thread.id}`,
        { headers }
      );

      const fullContent = threadDetailRes.data.content;

      return {
        id: thread.id,
        direction: thread.direction,
        isPublic: thread.isPublic,
        createdTime: thread.createdTime,
        from: thread.fromEmailAddress,
        to: thread.to,
        channel: thread.channel,
        content: fullContent || thread.summary || "[No content]"
      };
    } catch (err) {
      console.warn(`⚠️ Failed to fetch thread ${thread.id}`, err.message);
      return null;
    }
  })
);

};




exports.getOpenTickets = async (count = 10) => {
  const token = await getAccessToken();

  const res = await axios.get(`${API_BASE}/tickets`, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      orgId: process.env.ORG_ID,
    },
    params: {
      status: "Open",
      limit: parseInt(count),
      include: "contacts"
    }
  });

  const rawTickets = res.data.data;

  return rawTickets.map(ticket => ({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    email: ticket.email || ticket.contact?.email || "N/A",
    webUrl: ticket.webUrl
  }));
};



exports.getLastTwoMessages = async (ticketId) => {
  const token = await getAccessToken();

  const headers = {
    Authorization: `Zoho-oauthtoken ${token}`,
    orgId: process.env.ORG_ID,
  };

  // -------- fetch thread list --------
  let threads = [];                                        // <- DECLARED up-front
  try {
    const listRes = await axios.get(
      `${API_BASE}/tickets/${ticketId}/threads`,
      { headers }
    );
    threads = listRes.data?.data || [];
    console.log(`🧵 ticket ${ticketId} • total threads:`, threads.length);
  } catch (err) {
    console.warn(`⚠️  could not fetch thread list for ${ticketId}:`, err.message);
    return [];                                             // return empty, don’t throw
  }

  // keep only customer-visible incoming messages
  const incoming = threads
    .filter(t => t.direction === "in")
    .sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime));

  const lastTwo = incoming.slice(-2);                      // 1 or 2 items

  // -------- fetch full content for each --------
  const fullThreads = await Promise.all(
    lastTwo.map(async t => {
      try {
        const detail = await axios.get(
          `${API_BASE}/tickets/${ticketId}/threads/${t.id}`,
          { headers }
        );
        return {
          id         : t.id,
          createdTime: t.createdTime,
          content    : detail.data.content || t.summary || "[no content]"
        };
      } catch (err) {
        console.warn(`⚠️  thread ${t.id} detail 404/403:`, err.message);
        return null;
      }
    })
  );

  return fullThreads.filter(Boolean);                      // remove nulls
};


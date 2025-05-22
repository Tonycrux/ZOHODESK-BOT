const { getAllTicketsFromZoho, getFilteredTickets } = require("../services/zohoService");
const { getTicketWithThreads } = require("../services/zohoService");
const { getOpenTickets, getLastTwoMessages } = require("../services/zohoService");
const { analyzeMessages } = require("../services/aiService");


exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await getAllTicketsFromZoho();
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error("❌ Controller error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaginatedTickets = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const tickets = await getFilteredTickets(status, limit, page);
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error("❌ Controller error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const result = await getTicketWithThreads(ticketId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Failed to fetch ticket:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getOpenTicketsLimited = async (req, res) => {
  const count = parseInt(req.query.count || "10");
  try {
    const tickets = await getOpenTickets(count);
    res.json({ success: true, data: tickets });
  } catch (err) {
    console.error("❌ Failed to fetch tickets:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getTicketThreadsPreview = async (req, res) => {
  const { ticketId } = req.params;
  try {
    const result = await getLastTwoMessages(ticketId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.analyzeTicket = async (req, res) => {
  const { ticketId } = req.params;
  try {
    const messages = await getLastTwoMessages(ticketId);
    const result = await analyzeMessages(messages);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.processOpenTickets = async (req, res) => {
  try {
    console.log("Processing open tickets...");
    const count = parseInt(req.query.count || "10");
    const tickets = await getOpenTickets(count);
    const results = [];

    for (const ticket of tickets) {
      try {
        console.log(`Processing ticket ${ticket.id}...`);
        const messages = await getLastTwoMessages(ticket.id);
        const analysis = await analyzeMessages(messages);

        results.push({
          ticketId: ticket.id,
          subject: ticket.subject,
          email: ticket.email,
          status: ticket.status,
          decision: analysis.decision,
          sentiment: analysis.sentiment,
          reply: analysis.reply
        });
      } catch (err) {
        results.push({
          ticketId: ticket.id,
          subject: ticket.subject,
          email: ticket.email,
          status: ticket.status,
          decision: "Error",
          sentiment: "Unknown",
          reply: "",
          error: err.message
        });
      }
    }

    res.json({ success: true, processed: results });
  } catch (err) {
    console.error("🔥 Fatal controller error:", err);
    res.status(500).json({ success: false, message: "Unhandled error", error: err.message });
  }
};



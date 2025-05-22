
const { getOpenTickets, getLastTwoMessages, sendReplyAndClose } = require("../services/zohoService");
const { analyzeMessages } = require("../services/aiService");






exports.getOpenTicketsLimited = async (req, res) => {
  const count = parseInt(req.query.count || "10");
  try {
    const tickets = await getOpenTickets(count);
    res.json({ success: true, data: tickets });
  } catch (err) {
    //console.error("Failed to fetch tickets:", err.message);
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


exports.processOpenTickets = async (req, res) => {
  try {
    // ("Processing open tickets...");
    const count = parseInt(req.query.count || "10");
    const tickets = await getOpenTickets(count);
    const results = [];

    for (const ticket of tickets) {
      try {
        // console.log(`Processing ticket ${ticket.id}...`);

       
        const messages = await getLastTwoMessages(ticket.id);
        if (messages.some(m => m.hasAttach)) {
          results.push({
            ticketId : ticket.id,
            subject  : ticket.subject,
            email    : ticket.email,
            status   : ticket.status,
            decision : "Skip",
            sentiment: "Unknown",
            reply    : "",
            reason   : "Attachment present"
          });
          continue;
        }

        
        const analysis = await analyzeMessages(messages);   // { decision, sentiment, reply }

        if (analysis.decision.toLowerCase() === "respond") {
          // Send reply and close ticket
          try {
            await sendReplyAndClose(ticket.id, analysis.reply, ticket.email);

            results.push({
              ticketId : ticket.id,
              subject  : ticket.subject,
              email    : ticket.email,
              status   : "Closed",
              decision : "Replied",
              sentiment: analysis.sentiment,
              reply    : analysis.reply
            });
          } catch (apiErr) {
            results.push({
              ticketId : ticket.id,
              subject  : ticket.subject,
              email    : ticket.email,
              status   : ticket.status,
              decision : "Error",
              sentiment: analysis.sentiment,
              reply    : analysis.reply,
              error    : apiErr.message
            });
          }
        } else { // decision === Skip
          results.push({
            ticketId : ticket.id,
            subject  : ticket.subject,
            email    : ticket.email,
            status   : ticket.status,
            decision : "Skip",
            sentiment: analysis.sentiment,
            reply    : ""        // must be blank on skip
          });
        }

      } catch (err) {
        results.push({
          ticketId : ticket.id,
          subject  : ticket.subject,
          email    : ticket.email,
          status   : ticket.status,
          decision : "Error",
          sentiment: "Unknown",
          reply    : "",
          error    : err.message
        });
      }
    }

    res.json({ success: true, processed: results });
  } catch (err) {
    //console.error("Fatal controller error:", err);
    res.status(500).json({ success: false, message: "Unhandled error", error: err.message });
  }
};
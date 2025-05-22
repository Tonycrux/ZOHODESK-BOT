const express = require("express");
const router = express.Router();
const { getOpenTicketsLimited, getTicketThreadsPreview, processOpenTickets } = require("../controllers/ticketControllers");


router.get("/open-tickets", getOpenTicketsLimited);
router.get("/tickets/:ticketId/threads-preview", getTicketThreadsPreview);
router.get("/tickets/process", processOpenTickets);

module.exports = router;
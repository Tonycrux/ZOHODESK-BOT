const express = require("express");
const router = express.Router();
const { getAllTickets, getPaginatedTickets, getTicketById, getOpenTicketsLimited, getTicketThreadsPreview, analyzeTicket, processOpenTickets } = require("../controllers/ticketControllers");


router.get("/tickets", getAllTickets);
router.get("/paginatedtickets", getPaginatedTickets);
//router.get("/tickets/:ticketId", getTicketById);
router.get("/open-tickets", getOpenTicketsLimited);
router.get("/tickets/:ticketId/threads-preview", getTicketThreadsPreview);
router.get("/tickets/:ticketId/analyze", analyzeTicket);
router.get("/tickets/process", processOpenTickets);

module.exports = router;
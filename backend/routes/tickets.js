const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Helper to check valid transitions
const validTransitions = {
  'open': ['in_progress'],
  'in_progress': ['open', 'resolved'],
  'resolved': ['in_progress', 'closed'],
  'closed': ['resolved']
};

const isValidTransition = (current, next) => {
  if (current === next) return true;
  return validTransitions[current]?.includes(next);
};

// GET /tickets
router.get('/', async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    let tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    
    // SLA breach filtering has to be done after fetching since it's derived
    if (breached === 'true') {
      tickets = tickets.filter(t => t.toJSON().slaBreached === true);
    }
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /tickets/stats
router.get('/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    
    const stats = {
      statusCounts: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
      priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
      breachedCount: 0
    };
    
    tickets.forEach(t => {
      const tJson = t.toJSON();
      stats.statusCounts[t.status] = (stats.statusCounts[t.status] || 0) + 1;
      stats.priorityCounts[t.priority] = (stats.priorityCounts[t.priority] || 0) + 1;
      if (tJson.slaBreached && t.status !== 'closed') { // SLA breach usually means active tickets that are breached
        stats.breachedCount++;
      }
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /tickets
router.post('/', async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.validate(); // Explicitly validate to catch errors
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /tickets/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    if (status) {
      if (!isValidTransition(ticket.status, status)) {
        return res.status(400).json({ error: `Invalid status transition from ${ticket.status} to ${status}` });
      }
      
      // Handle resolvedAt logic
      if (status === 'resolved' && ticket.status !== 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (ticket.status === 'resolved' && status !== 'resolved') {
        ticket.resolvedAt = undefined;
      }
      
      ticket.status = status;
    }
    
    // Allow updating other fields optionally if needed, but assessment mostly mentions status
    // For now we just update status
    
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /tickets/:id
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

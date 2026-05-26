const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent']
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});

// Calculate ageMinutes and slaBreached before sending toJSON
ticketSchema.set('toJSON', {
  transform: (doc, ret) => {
    const now = ret.resolvedAt ? new Date(ret.resolvedAt) : new Date();
    const created = new Date(ret.createdAt);
    
    // ageMinutes is the time since creation (up to resolution time if resolved)
    ret.ageMinutes = Math.floor((now - created) / (1000 * 60));
    
    // SLA targets in hours
    const targets = {
      urgent: 1,
      high: 4,
      medium: 24,
      low: 72
    };
    
    const targetHours = targets[ret.priority] || 72;
    const targetMinutes = targetHours * 60;
    
    ret.slaBreached = ret.ageMinutes > targetMinutes;
    
    return ret;
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);

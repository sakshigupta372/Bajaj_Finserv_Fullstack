import React, { useState, useEffect } from 'react';
import { getTickets, getStats, updateTicketStatus, createTicket } from './api';
import { Clock, AlertCircle, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';

const PRIORITY_COLORS = {
  urgent: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low'
};

const COLUMNS = [
  { id: 'open', title: 'Open' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'resolved', title: 'Resolved' },
  { id: 'closed', title: 'Closed' }
];

const VALID_TRANSITIONS = {
  'open': ['in_progress'],
  'in_progress': ['open', 'resolved'],
  'resolved': ['in_progress', 'closed'],
  'closed': ['resolved']
};

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ priority: '', breached: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [ticketsData, statsData] = await Promise.all([
        getTickets(filters),
        getStats()
      ]);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleStatusChange = async (id, currentStatus, newStatus) => {
    try {
      // Optimistic update
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      await updateTicketStatus(id, newStatus);
      loadData(); // Refresh to get correct age/SLA
    } catch (error) {
      console.error('Status change failed', error);
      alert(error.response?.data?.error || 'Failed to update status');
      loadData(); // Revert on failure
    }
  };

  const getTicketsByStatus = (status) => tickets.filter(t => t.status === status);

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>DeskFlow</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Support Ticket Triage</p>
        </div>
        
        <div className="filters glass" style={{ padding: '0.75rem 1rem', borderRadius: '8px' }}>
          <select 
            className="form-control" 
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}
            value={filters.priority}
            onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={filters.breached}
              onChange={e => setFilters(prev => ({ ...prev, breached: e.target.checked }))}
            />
            Show Breached Only
          </label>
        </div>

        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> New Ticket
        </button>
      </header>

      {stats && (
        <div className="stats-strip glass">
          <div className="stat-item">
            <span className="stat-value">{stats.statusCounts.open || 0}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.statusCounts.in_progress || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.statusCounts.resolved || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
          <div className="stat-item" style={{ marginLeft: 'auto', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.breachedCount || 0}</span>
            <span className="stat-label">Currently Breached</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading board...</div>
      ) : (
        <div className="board">
          {COLUMNS.map((col, idx) => {
            const colTickets = getTicketsByStatus(col.id);
            const prevCol = idx > 0 ? COLUMNS[idx - 1] : null;
            const nextCol = idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;

            return (
              <div key={col.id} className="column">
                <div className="column-header">
                  <span className="column-title">{col.title}</span>
                  <span className="ticket-count">{colTickets.length}</span>
                </div>
                
                {colTickets.map(ticket => (
                  <div key={ticket._id} className={`ticket-card glass ticket-enter ${ticket.slaBreached ? 'breached' : ''}`}>
                    <div className="ticket-header">
                      <h3 className="ticket-subject">{ticket.subject}</h3>
                      <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ticket.description}
                    </p>
                    
                    <div className="ticket-meta">
                      <div className="meta-item">
                        <Clock size={14} /> 
                        {Math.floor(ticket.ageMinutes / 60)}h {ticket.ageMinutes % 60}m
                      </div>
                      {ticket.slaBreached && (
                        <div className="breached-badge">
                          <AlertCircle size={14} /> SLA Breached
                        </div>
                      )}
                    </div>

                    <div className="ticket-actions">
                      {prevCol && VALID_TRANSITIONS[ticket.status].includes(prevCol.id) && (
                        <button 
                          className="action-btn backward" 
                          onClick={() => handleStatusChange(ticket._id, ticket.status, prevCol.id)}
                          title={`Move to ${prevCol.title}`}
                        >
                          <ArrowLeft size={16} />
                        </button>
                      )}
                      {nextCol && VALID_TRANSITIONS[ticket.status].includes(nextCol.id) && (
                        <button 
                          className="action-btn forward"
                          onClick={() => handleStatusChange(ticket._id, ticket.status, nextCol.id)}
                          title={`Move to ${nextCol.title}`}
                        >
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <CreateTicketModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CreateTicketModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'medium'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      await createTicket(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass">
        <div className="modal-header">
          <h2>Create New Ticket</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="error-text" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
          
          <div className="form-group">
            <label>Subject</label>
            <input 
              required
              className="form-control"
              value={formData.subject}
              onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
            />
          </div>
          
          <div className="form-group">
            <label>Customer Email</label>
            <input 
              type="email"
              required
              className="form-control"
              value={formData.customerEmail}
              onChange={e => setFormData(p => ({ ...p, customerEmail: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select 
              className="form-control"
              value={formData.priority}
              onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              required
              className="form-control"
              rows={4}
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

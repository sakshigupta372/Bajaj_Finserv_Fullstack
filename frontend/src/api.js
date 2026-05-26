import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Update this when deployed
});

export const getTickets = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.status) params.append('status', filters.status);
  if (filters.breached) params.append('breached', 'true');
  
  const response = await api.get(`/tickets?${params.toString()}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/tickets/stats');
  return response.data;
};

export const createTicket = async (ticketData) => {
  const response = await api.post('/tickets', ticketData);
  return response.data;
};

export const updateTicketStatus = async (id, status) => {
  const response = await api.patch(`/tickets/${id}`, { status });
  return response.data;
};

# DeskFlow - Support Ticket Triage

This is a full-stack MERN application built as a support ticket management board. It features a Kanban-style interface with real-time status tracking, automated SLA breach detection, and strict state transition rules.

## Features

- **Strict Status Transitions:** Tickets must follow the flow: `Open -> In Progress -> Resolved -> Closed`. You can move backward one step, but never skip forward.
- **Automated SLAs:** Each priority level has a unique response target (Urgent: 1h, High: 4h, Medium: 24h, Low: 72h). The API automatically derives if a ticket is breached based on its age.
- **Dynamic Age Tracking:** The age of the ticket is computed on the fly. When a ticket is resolved, its age stops increasing.
- **Optimistic UI Updates:** Moving tickets across the board feels instant without requiring a page reload.
- **Premium Glassmorphic Design:** Features a dark-themed, glassmorphism UI for a modern aesthetic.

## Tech Stack
- **Frontend:** React (Vite), Axios, Lucide React (Icons), Vanilla CSS
- **Backend:** Node.js, Express, Mongoose (MongoDB)

## Local Setup

### 1. Backend
Open a terminal in the `backend` folder:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder if you want to use a remote MongoDB Atlas database, or leave it to use the local fallback:
```
MONGODB_URI=mongodb://localhost:27017/deskflow
PORT=5000
```

Start the backend server:
```bash
node server.js
```

### 2. Frontend
Open another terminal in the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```

The React app will be available at `http://localhost:5173`.

## Deployment Requirements
To meet the assessment constraints:
1. Push this repository to GitHub.
2. Deploy the **Frontend** to Vercel or Netlify. (Remember to update the `baseURL` in `frontend/src/api.js` to point to your deployed backend URL).
3. Deploy the **Backend** to Render or Railway.
4. Use a free **MongoDB Atlas** cluster and add the connection string to the backend's environment variables.

# Expense Tracker (MERN)

React (Vite) + Node.js/Express + MongoDB. Charts: Recharts. Auth: JWT + bcrypt (bcryptjs).

## Run locally

Requirements: Node.js 18+ and MongoDB running locally
(or put a MongoDB Atlas connection string in server/.env as MONGO_URI).

Terminal 1 - backend:

    cd server
    npm install
    npm run dev        (API on http://localhost:5000)

Terminal 2 - frontend:

    cd client
    npm install
    npm run dev        (app on http://localhost:5173)

Open http://localhost:5173, create an account and start tracking.

## Features

Register / log in / log out, dashboard (income, expenses, balance), add, edit and delete
income and expenses, categories, monthly budget with progress bar, pie and bar charts,
transaction history with search and filters, monthly report (print or save as PDF), CSV export.

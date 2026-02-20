// api/server.cjs — Local development email server
// Run this in a SECOND terminal tab: node api/server.cjs
// Vite proxies /api/* to this server during local development.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const sendTicketHandler = require('./send-ticket.cjs');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Route: POST /api/send-ticket
app.post('/api/send-ticket', sendTicketHandler);

// Health check
app.get('/api/health', (_req, res) => {
    const configured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    res.json({
        status: 'ok',
        gmail_configured: configured,
        gmail_user: process.env.GMAIL_USER || '(not set)',
    });
});

app.listen(PORT, () => {
    console.log('');
    console.log('🟠 LPU Events — Local Email Server');
    console.log(`   Listening on http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health`);
    console.log('');
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('⚠️  WARNING: GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env!');
        console.warn('   Emails will fail until these are configured.');
    } else {
        console.log(`✅ Gmail configured for: ${process.env.GMAIL_USER}`);
    }
    console.log('');
});

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// Добавляем поддержку переменных окружения
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// БЕРЕМ КЛЮЧ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent';

app.post('/api/chat', async (req, res) => {
    // Проверка, что ключ вообще задан
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: { message: 'API key is missing on the server' } });
    }

    try {
        console.log('Forwarding request to Gemini API...');
        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, req.body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 second timeout
        });

        console.log('Gemini responded successfully');
        res.json(response.data);
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error('Proxy Error:', JSON.stringify(errorData, null, 2));

        res.status(500).json({
            error: {
                message: error.response?.data?.error?.message || error.message || 'Unknown error'
            },
            details: errorData
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', nodeVersion: process.version });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gemini Proxy running on port ${PORT}`);
    console.log(`Node version: ${process.version}`);
});

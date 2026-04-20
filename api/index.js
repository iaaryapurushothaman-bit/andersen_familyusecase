import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Locally, load .env. On Vercel, this is ignored if variables are already set.
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

const PROJECT = process.env.VERTEX_PROJECT;
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL = process.env.VERTEX_MODEL || 'gemini-2.0-flash-001';

// ── Handle Google Credentials on Vercel ──────────────────────────────────────
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const tempCredsPath = path.join(os.tmpdir(), 'google-credentials.json');
        fs.writeFileSync(tempCredsPath, process.env.GOOGLE_CREDENTIALS_JSON);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredsPath;
        console.log('[API] ✅  Created temporary credentials file from GOOGLE_CREDENTIALS_JSON');
    } catch (err) {
        console.error('[API] ❌  Failed to create temporary credentials file:', err.message);
    }
} else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
        // Handle Vercel escaping literal \n
        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const credsObj = {
            type: "service_account",
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: privateKey
        };
        const tempCredsPath = path.join(os.tmpdir(), 'google-credentials-piecemeal.json');
        fs.writeFileSync(tempCredsPath, JSON.stringify(credsObj));
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredsPath;
        console.log('[API] ✅  Created temporary credentials file from piecemeal variables');
    } catch (err) {
        console.error('[API] ❌  Failed to construct temporary credentials file:', err.message);
    }
}

let ai = null;
try {
    ai = new GoogleGenAI({
        vertexai: true,
        project: PROJECT,
        location: LOCATION,
    });
} catch (startupErr) {
    console.error("[API] Failed to initialize GoogleGenAI on startup:", startupErr.message);
}

// Middleware to log requests (useful for Vercel logs)
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

app.post('/api/log', (req, res) => {
    // Dummy route to absorb frontend terminal logs on Vercel
    res.status(200).send('ok');
});

app.post('/api/vertex/generate', async (req, res) => {
    if (!ai) {
        return res.status(500).json({ error: 'GoogleGenAI failed to initialize. Check your Google credentials.' });
    }
    if (!PROJECT) {
        return res.status(500).json({ error: 'VERTEX_PROJECT environment variable not set in Vercel' });
    }
    try {
        const { model, contents, config } = req.body;
        const useModel = model || MODEL;
        const response = await ai.models.generateContent({
            model: useModel,
            contents,
            config,
        });
        res.json(response);
    } catch (err) {
        console.error('[API Error]:', err?.message || err);
        res.status(500).json({ error: err?.message || 'Internal server error' });
    }
});

app.get('/api/vertex/health', (_req, res) => {
    res.json({ 
        status: 'ok', 
        project: PROJECT, 
        location: LOCATION, 
        model: MODEL,
        deployed_on: 'vercel'
    });
});

// Default handler for all other /api routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: `Path ${req.url} not found on serverless function` });
});

// Vercel expects the app to be exported, not listen()
export default app;

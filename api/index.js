import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Locally, load .env. On Vercel, this is ignored if variables are already set.
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

const PROJECT = process.env.VERTEX_PROJECT;
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL = process.env.VERTEX_MODEL || 'gemini-2.0-flash-001';

const ai = new GoogleGenAI({
    vertexai: true,
    project: PROJECT,
    location: LOCATION,
});

// Middleware to log requests (useful for Vercel logs)
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

app.post('/api/vertex/generate', async (req, res) => {
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
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Path ${req.url} not found on serverless function` });
});

// Vercel expects the app to be exported, not listen()
export default app;

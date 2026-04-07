/**
 * Vertex AI Backend Proxy Server
 * Securely holds GCP credentials and proxies LLM requests from the browser to Vertex AI.
 */
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

// ── Vertex AI client ──────────────────────────────────────────────────────────
const PROJECT = process.env.VERTEX_PROJECT;
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL = process.env.VERTEX_MODEL || 'gemini-2.0-flash-001';

if (!PROJECT) {
    console.error('[Vertex Proxy] ❌  VERTEX_PROJECT is not set in .env');
    process.exit(1);
}

const ai = new GoogleGenAI({
    vertexai: true,
    project: PROJECT,
    location: LOCATION,
});

console.log(`[Vertex Proxy] ✅  Using project="${PROJECT}" location="${LOCATION}" model="${MODEL}"`);

// ── POST /api/vertex/generate ────────────────────────────────────────────────
// Body: { model?: string, contents: Content[], config?: GenerateContentConfig }
app.post('/api/vertex/generate', async (req, res) => {
    try {
        const { model, contents, config } = req.body;
        const useModel = model || MODEL;

        console.log(`[Vertex Proxy] → generateContent model="${useModel}" turns=${contents?.length}`);

        const response = await ai.models.generateContent({
            model: useModel,
            contents,
            config,
        });

        console.log(`[Vertex Proxy] ← OK finishReason=${response.candidates?.[0]?.finishReason}`);
        res.json(response);
    } catch (err) {
        console.error('[Vertex Proxy] ✗ Error:', err?.message || err);
        res.status(500).json({ error: err?.message || 'Internal server error' });
    }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/vertex/health', (_req, res) => {
    res.json({ status: 'ok', project: PROJECT, location: LOCATION, model: MODEL });
});

const PORT = process.env.PROXY_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[Vertex Proxy] 🚀  Server running on http://localhost:${PORT}`);
});

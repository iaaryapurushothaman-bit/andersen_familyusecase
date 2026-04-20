/**
 * VertexProxyLlm — a drop-in ADK LLM adapter that calls the backend proxy
 * instead of hitting Vertex AI or the Gemini API directly from the browser.
 *
 * The proxy server (server/index.js) holds the real GCP credentials.
 */
import { BaseLlm } from './adk-web-patch';

// ── Types (minimal, matching what ADK expects) ────────────────────────────────
interface LlmRequest {
    model?: string;
    contents?: any[];
    config?: any;
}

interface LlmResponse {
    content?: { role: string; parts: { text: string }[] };
    usageMetadata?: any;
    candidates?: any[];
}

// ── The adapter class ─────────────────────────────────────────────────────────
export class VertexProxyLlm extends BaseLlm {
    /** URL of the backend proxy endpoint */
    private readonly proxyUrl: string;
    public model: string;

    constructor({
        model = 'gemini-2.0-flash-001',
        proxyUrl = '/api/vertex/generate',
    }: {
        model?: string;
        proxyUrl?: string;
    } = {}) {
        super({ model });
        this.proxyUrl = proxyUrl;
        this.model = model;
    }

    // Supported model patterns (forwarded to the proxy, which decides the real model)
    static supportedModels = [/.*/];

    async *generateContentAsync(
        llmRequest: LlmRequest,
        _stream = false
    ): AsyncGenerator<LlmResponse> {
        const body = {
            model: llmRequest.model || this.model,
            contents: llmRequest.contents ?? [],
            config: llmRequest.config,
        };

        console.log('[VertexProxyLlm] → POST', this.proxyUrl, 'model=', body.model);

        let response: Response;
        try {
            response = await fetch(this.proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (networkErr: any) {
            throw new Error(
                `[VertexProxyLlm] Network error contacting proxy at ${this.proxyUrl}: ${networkErr.message}. ` +
                `Is the backend server running? (npm run server)`
            );
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`[VertexProxyLlm] Proxy error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log('[VertexProxyLlm] ← OK', JSON.stringify(data).slice(0, 120));

        // The proxy returns the raw Vertex AI GenerateContentResponse.
        // ADK expects an LlmResponse with `.content` and optionally `.usageMetadata`.
        const candidate = data?.candidates?.[0];
        const contentParts = candidate?.content?.parts ?? [];

        const llmResponse: LlmResponse = {
            content: {
                role: 'model',
                parts: contentParts,
            },
            usageMetadata: data?.usageMetadata,
            candidates: data?.candidates,
        };

        yield llmResponse;
    }
}

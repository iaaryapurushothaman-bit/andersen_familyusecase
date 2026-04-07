import React, { useState } from 'react';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { terminalLog, terminalError } from '../services/terminalLogger';

const ResearcherAgent: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        await terminalLog("Researcher UI: Initiating research for query:", query);

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await aiService.research(query);
            if (response.error) {
                await terminalError("Researcher UI: Service returned error:", response.error);
                setError(response.error);
            } else {
                await terminalLog("Researcher UI: Received content, length:", response.content?.length);
                setResult(response.content);
            }
        } catch (err: any) {
            await terminalError("Researcher UI: Catch error:", err.message);
            setError("Failed to reach Researcher Agent");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="card-ai" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <Search size={20} className="accent-blue" />
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>Researcher Agent</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Insights from internal & web data</p>
                </div>
            </div>

            <form onSubmit={handleResearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about industries, trends..."
                    style={{
                        flex: 1,
                        padding: '0.6rem 1rem',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    style={{
                        padding: '0.6rem 1.25rem',
                        backgroundColor: 'var(--accent-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: loading ? 'default' : 'pointer',
                        opacity: loading || !query.trim() ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                    Go
                </button>
            </form>


            {loading && !result && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem', minHeight: 0 }}>
                    <Loader2 size={32} className="spin accent-blue" />
                    <p style={{ fontSize: '0.875rem' }}>Gathering insights...</p>
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: '0.875rem' }}>{error}</span>
                </div>
            )}

            {result && (
                <div className="research-result-premium">
                    {result}
                </div>
            )}

            {!loading && !result && !error && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    <p style={{ fontSize: '0.875rem' }}>Ask a question to start the research process.</p>
                </div>
            )}
        </div>
    );
};

export default ResearcherAgent;

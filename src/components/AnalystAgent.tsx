
import React, { useState } from 'react';
import { BarChart3, Loader2, FileText, Download, TrendingUp } from 'lucide-react';
import { aiService } from '../services/aiService';
import { supabase } from '../supabaseClient';
import { terminalLog, terminalError } from '../services/terminalLogger';
import type { Business } from '../types';

interface AnalystAgentProps {
    selectedBusiness: Business | null;
}

const AnalystAgent: React.FC<AnalystAgentProps> = ({ selectedBusiness }) => {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Automatically check for cached report when selectedBusiness changes
    React.useEffect(() => {
        if (!selectedBusiness) {
            setReport(null);
            setError(null);
            return;
        }

        const checkCache = async () => {
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                const { data } = await supabase
                    .from('cached_reports')
                    .select('report_content')
                    .eq('company_name', selectedBusiness.name)
                    .single();

                if (data && data.report_content) {
                    await terminalLog("Analyst Agent: Found cached report for", selectedBusiness.name);
                    setReport(data.report_content);
                }
            }
        };

        setReport(null);
        setError(null);
        checkCache();
    }, [selectedBusiness]);

    const generateReport = async () => {
        if (!selectedBusiness) {
            await terminalLog("Analyst UI: generateReport called but no business selected.");
            return;
        }

        await terminalLog("Analyst UI: Initiating report generation for:", selectedBusiness.name);

        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await aiService.analyze(selectedBusiness);
            if (response.error) {
                await terminalError("Analyst UI: Service returned error:", response.error);
                setError(response.error);
            } else {
                await terminalLog("Analyst UI: Received report, length:", response.content?.length);
                setReport(response.content);

                // Save to Supabase cache
                if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                    const { error: insertError } = await supabase
                        .from('cached_reports')
                        .upsert([
                            {
                                company_name: selectedBusiness.name,
                                report_content: response.content
                            }
                        ], { onConflict: 'company_name' });

                    if (insertError) {
                        await terminalError("Analyst UI: Failed to cache report in Supabase:", insertError);
                    } else {
                        await terminalLog("Analyst UI: Successfully cached report in Supabase");
                    }
                }
            }
        } catch (err: any) {
            await terminalError("Analyst UI: Catch error:", err.message);
            setError("Failed to reach Analyst Agent");
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!report || !selectedBusiness) return;
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Strategic_Report_${selectedBusiness.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="card-ai" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <BarChart3 size={20} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>Analyst Agent</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Data analysis & strategic reports</p>
                </div>
            </div>

            {!selectedBusiness ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    <TrendingUp size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.875rem' }}>Select a business from the table to generate a strategic analysis report.</p>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Company</span>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedBusiness.name}</h4>
                            </div>
                            <button
                                onClick={generateReport}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#F59E0B',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: loading ? 'default' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loading ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                                {report ? 'Regenerate' : 'Generate Report'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: '#EF4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem' }}>{error}</span>
                        </div>
                    )}

                    {loading && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem' }}>
                            <Loader2 size={32} className="spin" style={{ color: '#F59E0B' }} />
                            <p style={{ fontSize: '0.875rem' }}>Analyzing market data...</p>
                        </div>
                    )}

                    {report && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div className="report-container">
                                {report}
                            </div>
                            <button
                                onClick={downloadReport}
                                style={{
                                    marginTop: '1rem',
                                    width: '100%',
                                    padding: '0.6rem',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={14} />
                                Download Report (Text)
                            </button>
                        </div>
                    )}

                    {!loading && !report && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                            <p style={{ fontSize: '0.875rem' }}>Ready for analysis.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalystAgent;

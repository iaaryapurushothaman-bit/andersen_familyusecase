import { Sparkles } from 'lucide-react';
import type { Business } from '../types';

interface BusinessTableProps {
    businesses: Business[];
    onSelect: (b: Business) => void;
    onAnalyze: (b: Business) => void;
}

const BusinessTable: React.FC<BusinessTableProps> = ({ businesses, onSelect, onAnalyze }) => {
    return (
        <div className="table-container">
            <table className="business-table">
                <thead>
                    <tr>
                        <th>Company Name</th>
                        <th>Family</th>
                        <th>Industry</th>
                        <th>Revenue</th>
                        <th style={{ textAlign: 'center' }}>Tier</th>
                        <th>Decision Maker</th>
                        <th>Contact Person</th>
                        <th style={{ textAlign: 'center' }}>Governance</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {businesses.map((business, index) => (
                        <tr key={index} onClick={() => onSelect(business)} style={{ cursor: 'pointer' }}>
                            <td style={{ fontWeight: 500 }}>{business.name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{business.family}</td>
                            <td>{business.industry}</td>
                            <td>{business.revenue}</td>
                            <td style={{ textAlign: 'center' }}>
                                <span className={`tier-badge tier-${business.tier}`}>
                                    Tier {business.tier}
                                </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{business.decisionMaker}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{business.contactPerson}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }} className={`governance-${business.governance.toLowerCase()}`}>
                                {business.governance}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAnalyze(business);
                                    }}
                                    className="analyze-row-button"
                                    title="AI Strategic Analysis"
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        color: '#F59E0B',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Sparkles size={14} />
                                    Analyze
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BusinessTable;

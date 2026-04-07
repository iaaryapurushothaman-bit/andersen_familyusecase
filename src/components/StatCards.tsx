import React from 'react';
import type { Business } from '../types';

interface StatCardsProps {
    businesses: Business[];
}

const StatCards: React.FC<StatCardsProps> = ({ businesses }) => {
    const tier1Count = businesses.filter(b => b.tier === '1').length;
    const highGrownCount = businesses.filter(b => b.governance === 'High').length;
    const industries = new Set(businesses.map(b => b.industry)).size;

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-value">{businesses.length}</div>
                <div className="stat-label">Total Companies</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{tier1Count}</div>
                <div className="stat-label">Tier 1 Strategic</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{highGrownCount}</div>
                <div className="stat-label">High Governance</div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{industries}</div>
                <div className="stat-label">Industries Represented</div>
            </div>
        </div>
    );
};

export default StatCards;

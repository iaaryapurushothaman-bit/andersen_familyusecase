import React, { useState } from 'react';
import { Search, Download, Loader2 } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { supabase } from '../supabaseClient';
import type { Business } from '../types';

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    industryFilter: string;
    setIndustryFilter: (s: string) => void;
    industries: string[];
    filteredBusinesses: Business[];
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    setSearchTerm,
    industryFilter,
    setIndustryFilter,
    industries,
    filteredBusinesses
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // 1. Fetch cached emails
            const { data: emailData } = await supabase
                .from('cached_emails')
                .select('company_name, decision_maker, email');

            const emailMap: Record<string, string> = {};
            emailData?.forEach(item => {
                const key = `${item.company_name}|${item.decision_maker}`;
                emailMap[key] = item.email;
            });

            // 2. Fetch cached details
            const { data: detailsData } = await supabase
                .from('cached_business_details')
                .select('company_name, address, employees, website');

            const detailsMap: Record<string, { address: string, employees: string, website: string | null }> = {};
            detailsData?.forEach(item => {
                detailsMap[item.company_name] = {
                    address: item.address,
                    employees: item.employees,
                    website: item.website
                };
            });

            // 3. Fetch cached LinkedIn URLs
            const { data: linkedinData } = await supabase
                .from('cached_linkedin_urls')
                .select('company_name, person_name, linkedin_url');

            const linkedinMap: Record<string, string> = {};
            linkedinData?.forEach(item => {
                const key = `${item.company_name}|${item.person_name}`;
                linkedinMap[key] = item.linkedin_url;
            });

            // 4. Trigger export
            exportToCSV(filteredBusinesses, emailMap, detailsMap, linkedinMap);
        } catch (error) {
            console.error('Export failed:', error);
            // Fallback to basic export if Supabase fails
            exportToCSV(filteredBusinesses);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="search-filter-bar">
            <div style={{ position: 'relative', flex: 1 }}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by company or family name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                />
                <Search
                    size={18}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                />
            </div>
            <select
                className="filter-select"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
            >
                <option value="">All Industries</option>
                {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                ))}
            </select>
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="export-button"
                title="Export current view to CSV"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    opacity: isExporting ? 0.7 : 1
                }}
            >
                {isExporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
        </div>
    );
};

export default SearchBar;

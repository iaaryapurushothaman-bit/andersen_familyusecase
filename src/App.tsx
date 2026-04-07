import { useState, useMemo } from 'react';
import businessData from './data/businesses.json';
import type { Business } from './types';
import StatCards from './components/StatCards';
import SearchBar from './components/SearchBar';
import BusinessTable from './components/BusinessTable';
import BusinessModal from './components/BusinessModal';
import ResearcherAgent from './components/ResearcherAgent';
import AnalystAgent from './components/AnalystAgent';
import { LayoutDashboard, Sparkles, Database } from 'lucide-react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'ai'>('dashboard');

  const businesses = useMemo(() => {
    return (businessData as Business[]).sort((a, b) => {
      return Number(a.tier) - Number(b.tier);
    });
  }, []);

  const industries = useMemo(() => {
    return Array.from(new Set(businesses.map(b => b.industry))).sort();
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.family.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIndustry = industryFilter === '' || b.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [businesses, searchTerm, industryFilter]);

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LayoutDashboard className="accent-blue" size={24} color="#3B82F6" />
            <h1>Family Business Intelligence</h1>
          </div>

          <nav style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button
              onClick={() => setView('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: view === 'dashboard' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: view === 'dashboard' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Database size={16} />
              Database
            </button>
            <button
              onClick={() => setView('ai')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: view === 'ai' ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                color: view === 'ai' ? '#EC4899' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Sparkles size={16} />
              AI Insights
            </button>
          </nav>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#A3A3A3' }}>
          Enterprise Data Portal v2.0-AI
        </div>
      </header>

      <main className="content">
        {view === 'dashboard' ? (
          <>
            <StatCards businesses={filteredBusinesses} />

            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              industryFilter={industryFilter}
              setIndustryFilter={setIndustryFilter}
              industries={industries}
              filteredBusinesses={filteredBusinesses}
            />

            <BusinessTable
              businesses={filteredBusinesses}
              onSelect={(b) => {
                setSelectedBusiness(b);
                setIsModalOpen(true);
              }}
              onAnalyze={(b) => {
                setSelectedBusiness(b);
                setView('ai');
              }}
            />

            {filteredBusinesses.length === 0 && (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#A3A3A3' }}>
                No companies found matching your criteria.
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '1.5rem', height: 'calc(100vh - 180px)', minHeight: 0 }}>
            <ResearcherAgent />
            <AnalystAgent selectedBusiness={selectedBusiness} />
          </div>
        )}
      </main>

      {isModalOpen && (
        <BusinessModal
          business={selectedBusiness}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { X, Mail, Loader2, MapPin, Users, Globe, Building, Linkedin } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Business } from '../types';

interface BusinessModalProps {
    business: Business | null;
    onClose: () => void;
}

const BusinessModal: React.FC<BusinessModalProps> = ({ business, onClose }) => {
    const [dmEmail, setDmEmail] = useState<string | null>(null);
    const [dmLoading, setDmLoading] = useState(false);
    const [dmError, setDmError] = useState<string | null>(null);

    const [cpEmail, setCpEmail] = useState<string | null>(null);
    const [cpLoading, setCpLoading] = useState(false);
    const [cpError, setCpError] = useState<string | null>(null);

    const [companyDetails, setCompanyDetails] = useState<{ address: string, employees: string, website: string | null } | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [dmLinkedin, setDmLinkedin] = useState<string | null>(null);
    const [dmLinkedinLoading, setDmLinkedinLoading] = useState(false);
    const [dmLinkedinError, setDmLinkedinError] = useState<string | null>(null);

    const [cpLinkedin, setCpLinkedin] = useState<string | null>(null);
    const [cpLinkedinLoading, setCpLinkedinLoading] = useState(false);
    const [cpLinkedinError, setCpLinkedinError] = useState<string | null>(null);

    // Load cached data automatically when business changes
    React.useEffect(() => {
        if (!business) return;

        setDmEmail(null);
        setDmError(null);
        setCpEmail(null);
        setCpError(null);
        setCompanyDetails(null);
        setDetailsError(null);
        setDmLinkedin(null);
        setDmLinkedinError(null);
        setCpLinkedin(null);
        setCpLinkedinError(null);

        const loadCache = async () => {
            if (!business) return;
            const companyName = business.name.trim();
            const dmName = business.decisionMaker.trim();

            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                try {
                    // Load cached DM email
                    const { data: dmData } = await supabase
                        .from('cached_emails')
                        .select('email')
                        .eq('company_name', companyName)
                        .eq('decision_maker', dmName)
                        .limit(1);

                    if (dmData && dmData.length > 0 && dmData[0].email) {
                        const email = dmData[0].email;
                        setDmEmail(email === 'NOT_FOUND' ? null : email);
                        if (email === 'NOT_FOUND') setDmError("Email not found");
                    }

                    // Load cached CP email
                    if (business.contactPerson && business.contactPerson.trim() !== "-") {
                        const cpName = business.contactPerson.trim();
                        const { data: cpData } = await supabase
                            .from('cached_emails')
                            .select('email')
                            .eq('company_name', companyName)
                            .eq('decision_maker', cpName)
                            .limit(1);

                        if (cpData && cpData.length > 0 && cpData[0].email) {
                            const email = cpData[0].email;
                            setCpEmail(email === 'NOT_FOUND' ? null : email);
                            if (email === 'NOT_FOUND') setCpError("Email not found");
                        }
                    }

                    // Load cached LinkedIn for DM
                    const { data: dmLInData } = await supabase
                        .from('cached_linkedin_urls')
                        .select('linkedin_url')
                        .eq('company_name', companyName)
                        .eq('person_name', dmName)
                        .limit(1);
                    if (dmLInData && dmLInData.length > 0) {
                        const url = dmLInData[0].linkedin_url;
                        if (url === 'NOT_FOUND') {
                            setDmLinkedinError("LinkedIn profile not found");
                        } else {
                            setDmLinkedin(url);
                        }
                    }

                    // Load cached LinkedIn for CP
                    if (business.contactPerson && business.contactPerson.trim() !== "-") {
                        const cpName = business.contactPerson.trim();
                        const { data: cpLInData } = await supabase
                            .from('cached_linkedin_urls')
                            .select('linkedin_url')
                            .eq('company_name', companyName)
                            .eq('person_name', cpName)
                            .limit(1);
                        if (cpLInData && cpLInData.length > 0) {
                            const url = cpLInData[0].linkedin_url;
                            if (url === 'NOT_FOUND') {
                                setCpLinkedinError("LinkedIn profile not found");
                            } else {
                                setCpLinkedin(url);
                            }
                        }
                    }

                    // Load cached company details
                    const { data: detailsData } = await supabase
                        .from('cached_business_details')
                        .select('address, employees, website')
                        .eq('company_name', companyName)
                        .limit(1);

                    if (detailsData && detailsData.length > 0) {
                        setCompanyDetails({
                            address: detailsData[0].address,
                            employees: detailsData[0].employees,
                            website: detailsData[0].website
                        });
                    }
                } catch (err) {
                    console.error("Cache loading failed:", err);
                }
            }
        };

        loadCache();
    }, [business]);

    if (!business) return null;

    const handleFindEmail = async (name: string, type: 'dm' | 'cp') => {
        const setLoading = type === 'dm' ? setDmLoading : setCpLoading;
        const setEmail = type === 'dm' ? setDmEmail : setCpEmail;
        const setError = type === 'dm' ? setDmError : setCpError;
        const currentEmail = type === 'dm' ? dmEmail : cpEmail;

        setLoading(true);
        setError(null);
        try {
            // 1. Check state
            if (currentEmail) {
                setLoading(false);
                return;
            }

            const companyName = business.name.trim();
            const personName = name.trim();

            // Check cache
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                const { data: cachedData } = await supabase
                    .from('cached_emails')
                    .select('email')
                    .eq('company_name', companyName)
                    .eq('decision_maker', personName)
                    .limit(1);

                if (cachedData && cachedData.length > 0 && cachedData[0].email) {
                    const email = cachedData[0].email;
                    if (email === 'NOT_FOUND') {
                        setError("Email not found");
                    } else {
                        setEmail(email);
                    }
                    setLoading(false);
                    return;
                }
            }

            // 2. Not in cache? Call GetProspect API
            const apiKey = import.meta.env.VITE_GETPROSPECT_API_KEY;
            if (!apiKey) {
                throw new Error("API Key missing. Please add VITE_GETPROSPECT_API_KEY to your .env file.");
            }

            const queryParams = new URLSearchParams({
                name: personName,
                company: companyName
            });

            const response = await fetch(`${window.location.origin}/getprospect/public/v1/email/find?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'apiKey': apiKey
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            let foundEmail: string | null = null;
            if (data && data.email) {
                foundEmail = data.email;
            } else if (data && data.data && data.data.email) {
                foundEmail = data.data.email;
            }

            if (foundEmail) {
                setEmail(foundEmail);

                // 3. Save to cache
                if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                    const { error: insertError } = await supabase
                        .from('cached_emails')
                        .insert([
                            {
                                company_name: companyName,
                                decision_maker: personName,
                                email: foundEmail
                            }
                        ]);
                    if (insertError) {
                        console.error("Failed to cache email in Supabase:", insertError);
                    }
                }
            } else {
                setError("Email not found");
                // Cache negative result
                if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                    await supabase
                        .from('cached_emails')
                        .insert([{
                            company_name: companyName,
                            decision_maker: personName,
                            email: 'NOT_FOUND'
                        }]);
                }
            }
        } catch (err: any) {
            console.error("Error fetching email:", err);
            setError(err.message || "Failed to find email");
        } finally {
            setLoading(false);
        }
    };

    const handleFindLinkedin = async (name: string, type: 'dm' | 'cp') => {
        const setLoading = type === 'dm' ? setDmLinkedinLoading : setCpLinkedinLoading;
        const setLinkedin = type === 'dm' ? setDmLinkedin : setCpLinkedin;
        const setError = type === 'dm' ? setDmLinkedinError : setCpLinkedinError;

        setLoading(true);
        setError(null);
        try {
            const companyName = business.name.trim();
            const personName = name.trim();

            // 1. Check cache first
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                const { data: cachedData, error: cacheError } = await supabase
                    .from('cached_linkedin_urls')
                    .select('linkedin_url')
                    .eq('company_name', companyName)
                    .eq('person_name', personName)
                    .limit(1);

                if (cachedData && cachedData.length > 0 && !cacheError) {
                    const url = cachedData[0].linkedin_url;
                    if (url === 'NOT_FOUND') {
                        setError("LinkedIn profile not found");
                    } else {
                        setLinkedin(url);
                    }
                    setLoading(false);
                    return;
                }
            }

            // 2. Call API if not in cache
            const apiKey = import.meta.env.VITE_LINKFINDER_API_KEY;
            if (!apiKey) {
                throw new Error("Linkfinder API Key missing. Please add VITE_LINKFINDER_API_KEY to your .env file.");
            }

            const response = await fetch(`${window.location.origin}/linkfinder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    type: "lead_full_name_to_linkedin_url",
                    input_data: `${name} ${business.name}`
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            let foundUrl: string | null = null;
            if (data && data.result) {
                foundUrl = data.result;
                setLinkedin(foundUrl);
            } else {
                setError("LinkedIn profile not found");
                foundUrl = 'NOT_FOUND';
            }

            // 3. Store result in cache
            if (foundUrl && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                const companyName = business.name.trim();
                const personName = name.trim();
                await supabase
                    .from('cached_linkedin_urls')
                    .insert([{
                        company_name: companyName,
                        person_name: personName,
                        linkedin_url: foundUrl
                    }]);
            }
        } catch (err: any) {
            console.error("Error fetching LinkedIn:", err);
            setError(err.message || "Failed to find LinkedIn profile");
        } finally {
            setLoading(false);
        }
    };

    const handleGetCompanyDetails = async () => {
        setLoadingDetails(true);
        setDetailsError(null);
        try {
            const companyName = business.name.trim();
            // 1. Check cache first
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                const { data: cachedData } = await supabase
                    .from('cached_business_details')
                    .select('address, employees, website')
                    .eq('company_name', companyName)
                    .limit(1);

                if (cachedData && cachedData.length > 0) {
                    setCompanyDetails({
                        address: cachedData[0].address,
                        employees: cachedData[0].employees,
                        website: cachedData[0].website
                    });
                    setLoadingDetails(false);
                    return;
                }
            }

            // 2. Fetch from multiple APIs
            const gpApiKey = import.meta.env.VITE_GETPROSPECT_API_KEY;
            const lfApiKey = import.meta.env.VITE_LINKFINDER_API_KEY;

            if (!gpApiKey || !lfApiKey) {
                throw new Error("Missing API Keys (GetProspect or Linkfinder). Please check your .env file.");
            }

            const encodedName = encodeURIComponent(business.name);

            // Fetch in parallel
            const [gpResponse, lfWebsiteResponse, lfEmployeesResponse] = await Promise.all([
                // GetProspect for Headquarters
                fetch(`${window.location.origin}/getprospect/api/v1/insights/search/fast-search/${encodedName}`, {
                    method: 'GET',
                    headers: { 'apiKey': gpApiKey, 'content-type': 'application/json' }
                }),
                // Linkfinder for Website
                fetch(`${window.location.origin}/linkfinder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lfApiKey}` },
                    body: JSON.stringify({ type: "company_name_to_website", input_data: business.name })
                }),
                // Linkfinder for Employee Count
                fetch(`${window.location.origin}/linkfinder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lfApiKey}` },
                    body: JSON.stringify({ type: "company_name_to_employee_count", input_data: business.name })
                })
            ]);

            // Process GetProspect (Headquarters)
            let headquarters = "Address not available";
            if (gpResponse.ok) {
                const gpData = await gpResponse.json();
                const targetCompany = gpData?.companies?.data?.[0];
                if (targetCompany) {
                    headquarters = targetCompany.headquarters || targetCompany.location || "Address not available";
                } else {
                    headquarters = "Company not found in GetProspect";
                }
            }

            // Process Linkfinder (Website)
            let website = null;
            if (lfWebsiteResponse.ok) {
                const lfData = await lfWebsiteResponse.json();
                if (lfData && lfData.result && lfData.result !== "Not Found") {
                    website = lfData.result;
                }
            }

            // Process Linkfinder (Employees)
            let employees = "Size not available";
            if (lfEmployeesResponse.ok) {
                const lfData = await lfEmployeesResponse.json();
                if (lfData && lfData.result && lfData.result !== "Not Found") {
                    employees = lfData.result;
                }
            }

            const newDetails = {
                address: String(headquarters),
                employees: String(employees),
                website: website ? String(website) : null
            };

            setCompanyDetails(newDetails);

            // 2. Save to cache
            if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
                const companyName = business.name.trim();
                const { error: insertError } = await supabase
                    .from('cached_business_details')
                    .upsert([
                        {
                            company_name: companyName,
                            ...newDetails
                        }
                    ], { onConflict: 'company_name' });

                if (insertError) {
                    console.error("Failed to cache business details in Supabase:", insertError);
                }
            }

        } catch (err: any) {
            console.error("Error fetching company details:", err);
            setDetailsError(err.message || "Failed to fetch company details");
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>{business.name}</h2>
                <p style={{ color: 'var(--accent-blue)', fontWeight: 500, marginBottom: '2rem' }}>
                    {business.family} Family Portfolio
                </p>

                <div className="modal-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0 }}>Opportunity Signals</h3>
                        {!companyDetails && !loadingDetails && (
                            <button
                                onClick={handleGetCompanyDetails}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.75rem',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--accent-blue)',
                                    border: '1px solid var(--accent-blue)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <Building size={14} />
                                Fetch Details
                            </button>
                        )}
                        {loadingDetails && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontSize: '0.75rem', fontWeight: 600 }}>
                                <Loader2 size={14} className="spin" />
                                Fetching...
                            </div>
                        )}
                    </div>
                    <p>{business.signals}</p>

                    {detailsError && (
                        <p style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            {detailsError}
                        </p>
                    )}

                    {companyDetails && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            borderLeft: '4px solid var(--accent-blue)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <MapPin size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Headquarters</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{companyDetails.address}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <Users size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Company Size</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{companyDetails.employees} Employees</span>
                                </div>
                            </div>
                            {companyDetails.website && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <Globe size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Website</span>
                                        <a href={companyDetails.website.startsWith('http') ? companyDetails.website : `https://${companyDetails.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                                            {companyDetails.website}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-section">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem' }}>Key Decision Maker</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <Users size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ minHeight: '3.5rem' }}>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{business.decisionMaker}</p>
                                        {business.position && business.position !== "-" && (
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                {business.position}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        {/* Email Group */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'flex-start' }}>
                                            {!dmEmail && !dmLoading && (
                                                <button
                                                    onClick={() => handleFindEmail(business.decisionMaker, 'dm')}
                                                    className="btn-find-email"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.4rem 0.8rem',
                                                        backgroundColor: 'var(--accent-blue)',
                                                        color: 'white',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Mail size={14} />
                                                    Find Email
                                                </button>
                                            )}
                                            {dmLoading && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                    <Loader2 size={14} className="spin" />
                                                    <span>Searching Email...</span>
                                                </div>
                                            )}
                                            {dmEmail && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    color: 'var(--accent-emerald)',
                                                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    width: 'fit-content',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <Mail size={14} />
                                                    <span style={{ fontWeight: 500 }}>{dmEmail}</span>
                                                </div>
                                            )}
                                            {dmError && (
                                                <p style={{ color: '#EF4444', fontSize: '0.7rem', margin: 0 }}>
                                                    {dmError}
                                                </p>
                                            )}
                                        </div>

                                        {/* LinkedIn Group */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'flex-start' }}>
                                            {!dmLinkedin && !dmLinkedinLoading && (
                                                <button
                                                    onClick={() => handleFindLinkedin(business.decisionMaker, 'dm')}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.4rem 0.8rem',
                                                        backgroundColor: '#0077b5',
                                                        color: 'white',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Linkedin size={14} />
                                                    Find LinkedIn
                                                </button>
                                            )}
                                            {dmLinkedinLoading && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                    <Loader2 size={14} className="spin" />
                                                    <span>Searching LinkedIn...</span>
                                                </div>
                                            )}
                                            {dmLinkedin && (
                                                <a
                                                    href={dmLinkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        color: '#0077b5',
                                                        backgroundColor: 'rgba(0, 119, 181, 0.1)',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        width: 'fit-content',
                                                        fontSize: '0.875rem',
                                                        textDecoration: 'none',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <Linkedin size={14} />
                                                    LinkedIn Profile
                                                </a>
                                            )}
                                            {dmLinkedinError && (
                                                <p style={{ color: '#EF4444', fontSize: '0.7rem', margin: 0 }}>
                                                    {dmLinkedinError}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '0.75rem' }}>Contact Person</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <Users size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ minHeight: '3.5rem' }}>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{business.contactPerson || '-'}</p>
                                        </div>

                                        {business.contactPerson && business.contactPerson !== "-" && (
                                            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                {/* Email Group */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'flex-start' }}>
                                                    {!cpEmail && !cpLoading && (
                                                        <button
                                                            onClick={() => handleFindEmail(business.contactPerson!, 'cp')}
                                                            className="btn-find-email"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                padding: '0.4rem 0.8rem',
                                                                backgroundColor: 'var(--accent-emerald)',
                                                                color: 'white',
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Mail size={14} />
                                                            Find Email
                                                        </button>
                                                    )}
                                                    {cpLoading && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                            <Loader2 size={14} className="spin" />
                                                            <span>Searching Email...</span>
                                                        </div>
                                                    )}
                                                    {cpEmail && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            color: 'var(--accent-emerald)',
                                                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            width: 'fit-content',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <Mail size={14} />
                                                            <span style={{ fontWeight: 500 }}>{cpEmail}</span>
                                                        </div>
                                                    )}
                                                    {cpError && (
                                                        <p style={{ color: '#EF4444', fontSize: '0.7rem', margin: 0 }}>
                                                            {cpError}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* LinkedIn Group */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', alignItems: 'flex-start' }}>
                                                    {!cpLinkedin && !cpLinkedinLoading && (
                                                        <button
                                                            onClick={() => handleFindLinkedin(business.contactPerson!, 'cp')}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                padding: '0.4rem 0.8rem',
                                                                backgroundColor: '#0077b5',
                                                                color: 'white',
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Linkedin size={14} />
                                                            Find LinkedIn
                                                        </button>
                                                    )}
                                                    {cpLinkedinLoading && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                            <Loader2 size={14} className="spin" />
                                                            <span>Searching LinkedIn...</span>
                                                        </div>
                                                    )}
                                                    {cpLinkedin && (
                                                        <a
                                                            href={cpLinkedin}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                color: '#0077b5',
                                                                backgroundColor: 'rgba(0, 119, 181, 0.1)',
                                                                padding: '0.4rem 0.8rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                width: 'fit-content',
                                                                fontSize: '0.875rem',
                                                                textDecoration: 'none',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            <Linkedin size={14} />
                                                            LinkedIn Profile
                                                        </a>
                                                    )}
                                                    {cpLinkedinError && (
                                                        <p style={{ color: '#EF4444', fontSize: '0.7rem', margin: 0 }}>
                                                            {cpLinkedinError}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="modal-section">
                        <h3>Revenue (Est.)</h3>
                        <p>{business.revenue}</p>
                    </div>
                    <div className="modal-section">
                        <h3>Governance Maturity</h3>
                        <p className={`governance-${business.governance.toLowerCase()}`}>
                            {business.governance}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessModal;

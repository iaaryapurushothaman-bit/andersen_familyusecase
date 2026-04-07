import type { Business } from '../types';

/**
 * Converts an array of Business objects to a CSV string and triggers a download.
 */
export const exportToCSV = (
  data: Business[],
  cachedEmails: Record<string, string> = {},
  cachedDetails: Record<string, { address: string, employees: string, website: string | null }> = {},
  cachedLinkedin: Record<string, string> = {},
  filename: string = 'businesses_export.csv'
) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // 1. Define headers
  const headers = [
    'Name',
    'Family',
    'Industry',
    'Revenue',
    'Tier',
    'Governance',
    'Decision Maker',
    'Position',
    'Contact Person',
    'Email (Decision Maker)',
    'Email (Contact Person)',
    'LinkedIn (Decision Maker)',
    'LinkedIn (Contact Person)',
    'Headquarters',
    'Employee Size',
    'Website',
    'Signals'
  ];

  // Helper to format email status
  const getEmailStatus = (companyName: string, personName: string | undefined) => {
    if (!personName || personName === '-') return '-';
    const key = `${companyName}|${personName}`;
    const email = cachedEmails[key];

    if (email === 'NOT_FOUND') return 'Not in the database';
    if (email) return email;
    return 'Publicly Undisclosed';
  };

  // Helper to format LinkedIn status
  const getLinkedinStatus = (companyName: string, personName: string | undefined) => {
    if (!personName || personName === '-') return '-';
    const key = `${companyName}|${personName}`;
    const linkedin = (cachedLinkedin as any)[key];

    if (linkedin === 'NOT_FOUND') return 'No Verified public profile found';
    if (linkedin) return linkedin;
    return 'No Verified public profile found';
  };

  // Helper to format detail status
  const getDetailStatus = (value: string | null | undefined) => {
    if (!value ||
      value === 'N/A' ||
      value === 'Size not available' ||
      value === 'Address not available' ||
      value === 'Company not found in GetProspect Database'
    ) {
      return 'Yet to be discovered';
    }
    return value;
  };

  // 2. Map data to rows
  const rows = data.map(b => {
    const details = cachedDetails[b.name];

    return [
      `"${b.name.replace(/"/g, '""')}"`,
      `"${b.family.replace(/"/g, '""')}"`,
      `"${b.industry.replace(/"/g, '""')}"`,
      `"${b.revenue.replace(/"/g, '""')}"`,
      `"${b.tier.replace(/"/g, '""')}"`,
      `"${b.governance.replace(/"/g, '""')}"`,
      `"${b.decisionMaker.replace(/"/g, '""')}"`,
      `"${(b.position || '').replace(/"/g, '""')}"`,
      `"${(b.contactPerson || '').replace(/"/g, '""')}"`,
      `"${getEmailStatus(b.name, b.decisionMaker)}"`,
      `"${getEmailStatus(b.name, b.contactPerson)}"`,
      `"${getLinkedinStatus(b.name, b.decisionMaker)}"`,
      `"${getLinkedinStatus(b.name, b.contactPerson)}"`,
      `"${getDetailStatus(details?.address).replace(/"/g, '""')}"`,
      `"${getDetailStatus(details?.employees).replace(/"/g, '""')}"`,
      `"${getDetailStatus(details?.website).replace(/"/g, '""')}"`,
      `"${b.signals.replace(/"/g, '""')}"`
    ].join(',');
  });

  // 3. Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // 4. Create a Blob with BOM and trigger download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

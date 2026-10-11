import { CallRecord, LeadRecord } from '../types/agent';

export interface ParsedCsvRow {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  consent: boolean;
  notes?: string;
}

export interface CsvParseResult {
  records: ParsedCsvRow[];
  errors: string[];
}

/**
 * Robust CSV parser that handles quotes, commas, and newlines
 */
export function parseLeadsCsv(csvContent: string): CsvParseResult {
  const errors: string[] = [];
  const records: ParsedCsvRow[] = [];

  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      records: [],
      errors: ['CSV file is empty or does not contain a header and data rows.'],
    };
  }

  // Parse header
  const headerParts = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const nameIdx = headerParts.findIndex((h) => h === 'name' || h === 'full_name' || h === 'lead_name');
  const phoneIdx = headerParts.findIndex((h) => h === 'phone' || h === 'phone_number' || h === 'mobile' || h === 'contact');
  const emailIdx = headerParts.findIndex((h) => h === 'email' || h === 'email_address');
  const sourceIdx = headerParts.findIndex((h) => h === 'source' || h === 'lead_source' || h === 'channel');
  const consentIdx = headerParts.findIndex((h) => h === 'consent' || h === 'opt_in' || h === 'consented');
  const notesIdx = headerParts.findIndex((h) => h === 'notes' || h === 'note' || h === 'remarks');

  if (phoneIdx === -1) {
    return {
      records: [],
      errors: ['CSV must have a "phone" column header.'],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const parts = parseCsvLine(lines[i]);

    const rawPhone = parts[phoneIdx] || '';
    const phone = rawPhone.trim();

    if (!phone) {
      errors.push(`Row ${rowNum}: Rejected - Missing phone number.`);
      continue;
    }

    const rawName = nameIdx !== -1 ? parts[nameIdx] : '';
    const name = rawName.trim() || 'Valued Lead';

    const rawEmail = emailIdx !== -1 ? parts[emailIdx] : '';
    const email = rawEmail.trim();

    const rawSource = sourceIdx !== -1 ? parts[sourceIdx] : '';
    const source = rawSource.trim() || 'CSV Import';

    const rawConsent = consentIdx !== -1 ? parts[consentIdx] : 'true';
    const consent =
      String(rawConsent).toLowerCase() === 'true' ||
      String(rawConsent).toLowerCase() === 'yes' ||
      String(rawConsent).toLowerCase() === '1';

    const rawNotes = notesIdx !== -1 ? parts[notesIdx] : '';
    const notes = rawNotes.trim();

    records.push({
      name,
      phone,
      email,
      source,
      consent,
      notes,
    });
  }

  return { records, errors };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Exports combined processed leads and call outcomes to CSV
 */
export function exportResultsToCsv(leads: LeadRecord[], calls: CallRecord[]): void {
  const headers = [
    'name',
    'phone',
    'source',
    'consent',
    'call_status',
    'interest',
    'buyer_type',
    'property_type',
    'budget',
    'location',
    'timeline',
    'outcome',
    'summary',
    'next_action',
    'called_at',
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead) => {
    // Find the latest call for this lead if available
    const leadCalls = calls.filter((c) => c.leadId === lead.id);
    const lastCall = leadCalls.length > 0 ? leadCalls[0] : null;

    return [
      escapeCsv(lead.name),
      escapeCsv(lead.phone),
      escapeCsv(lead.source),
      escapeCsv(lead.consent ? 'true' : 'false'),
      escapeCsv(lead.callStatus),
      escapeCsv(lastCall?.interest || lead.interest || ''),
      escapeCsv(lastCall?.buyerType || lead.buyerType || ''),
      escapeCsv(lastCall?.propertyType || lead.propertyType || ''),
      escapeCsv(lastCall?.budget || lead.budget || ''),
      escapeCsv(lastCall?.location || lead.location || ''),
      escapeCsv(lastCall?.timeline || lead.timeline || ''),
      escapeCsv(lead.outcome || lastCall?.outcome || 'NOT_CALLED'),
      escapeCsv(lastCall?.summary || lead.notes || ''),
      escapeCsv(lastCall?.nextAction || ''),
      escapeCsv(lead.lastCalledAt || lastCall?.endedAt || ''),
    ].join(',');
  });

  const csvString = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chennai_real_estate_lead_qualification_results_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

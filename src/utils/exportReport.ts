import { CallRecord, LeadRecord } from '../types/agent';

export interface FilterExportOptions {
  date?: string; // 'ALL' or 'YYYY-MM-DD'
  customerName?: string;
  outcome?: string; // 'ALL' | 'HOT' | 'WARM' | 'COLD' | 'OPT_OUT'
}

/**
 * Filter calls according to Date, Customer Name, and Outcome
 */
export function filterCallRecords(
  calls: CallRecord[],
  options: FilterExportOptions
): CallRecord[] {
  return calls.filter((c) => {
    // 1. Date filter
    if (options.date && options.date !== 'ALL') {
      const callDate = c.startedAt ? c.startedAt.slice(0, 10) : '';
      if (callDate !== options.date) return false;
    }

    // 2. Customer Name search
    if (options.customerName && options.customerName.trim()) {
      const term = options.customerName.trim().toLowerCase();
      const matchName = c.leadName.toLowerCase().includes(term);
      const matchPhone = c.leadPhone.includes(term);
      if (!matchName && !matchPhone) return false;
    }

    // 3. Outcome filter
    if (options.outcome && options.outcome !== 'ALL') {
      if (c.outcome !== options.outcome) return false;
    }

    return true;
  });
}

/**
 * Export filtered call records as Excel-compatible CSV file with UTF-8 BOM
 */
export function exportToExcelCsv(calls: CallRecord[], filename: string = 'chennai_real_estate_leads.csv') {
  const headers = [
    'Call Date',
    'Call Time',
    'Customer Name',
    'Phone Number',
    'Qualification Status',
    'Stated Property Type',
    'Stated Budget',
    'Preferred Location',
    'Buying Timeline',
    'Call Duration (Sec)',
    'Customer Conversation Summary',
    'Next Action',
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = calls.map((c) => {
    const started = c.startedAt ? new Date(c.startedAt) : new Date();
    const dateStr = started.toISOString().slice(0, 10);
    const timeStr = started.toLocaleTimeString();

    return [
      escapeCsv(dateStr),
      escapeCsv(timeStr),
      escapeCsv(c.leadName),
      escapeCsv(c.leadPhone),
      escapeCsv(c.outcome || 'COLD'),
      escapeCsv(c.propertyType || 'Residential'),
      escapeCsv(c.budget || 'Not Disclosed'),
      escapeCsv(c.location || 'Chennai'),
      escapeCsv(c.timeline || 'Exploring'),
      escapeCsv(c.duration || 0),
      escapeCsv(c.summary || 'Call completed.'),
      escapeCsv(c.nextAction || 'Follow up with property portfolio.'),
    ].join(',');
  });

  // UTF-8 BOM for Microsoft Excel proper multilingual / Tamil character rendering
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export filtered calls as structured JSON
 */
export function exportToJson(calls: CallRecord[], filename: string = 'lyka_leads_details.json') {
  const formatted = calls.map((c) => ({
    callId: c.callId,
    customerName: c.leadName,
    phone: c.leadPhone,
    date: c.startedAt ? c.startedAt.slice(0, 10) : '',
    callTimestamp: c.startedAt,
    qualificationStatus: c.outcome,
    durationSeconds: c.duration,
    customerRequirements: {
      budget: c.budget || 'Unspecified',
      location: c.location || 'Chennai',
      propertyType: c.propertyType || 'Apartment / Villa',
      timeline: c.timeline || 'Flexible',
      buyerType: c.buyerType || 'Homebuyer',
      interest: c.interest || 'Interested',
    },
    executiveSummary: c.summary,
    nextAction: c.nextAction,
    sentiment: c.sentiment,
    conversationTranscript: c.transcript.map((t) => ({
      speaker: t.role === 'agent' ? 'Executive (Lyka Agent)' : 'Customer',
      speech: t.text,
      time: t.timestamp,
    })),
  }));

  const jsonString = JSON.stringify(formatted, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a pristine printable executive PDF / HTML report
 */
export function generatePrintablePdfReport(
  calls: CallRecord[],
  options: FilterExportOptions
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF report.');
    return;
  }

  const dateLabel = options.date && options.date !== 'ALL' ? options.date : 'All Dates (Full Archive)';
  const totalCalls = calls.length;
  const hotCount = calls.filter((c) => c.outcome === 'HOT').length;
  const warmCount = calls.filter((c) => c.outcome === 'WARM').length;
  const coldCount = calls.filter((c) => c.outcome === 'COLD').length;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lyka Realty - Lead Qualification Report</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 15mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      margin: 0;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand h1 { margin: 0; font-size: 22px; color: #0f172a; font-weight: 700; }
    .brand p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .kpi-val { font-size: 24px; font-weight: 700; margin-top: 4px; color: #0f172a; }
    .badge-hot { color: #dc2626; background: #fee2e2; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .badge-warm { color: #d97706; background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .badge-cold { color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 16px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #cbd5e1;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) { background: #fafafa; }
    .customer-name { font-weight: 600; color: #0f172a; font-size: 13px; }
    .customer-phone { font-family: monospace; color: #64748b; font-size: 11px; }
    .tag { display: inline-block; font-size: 10px; background: #e2e8f0; padding: 1px 6px; border-radius: 3px; margin: 1px; color: #334155; }
    .footer {
      margin-top: 32px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    .print-btn-bar {
      margin-bottom: 20px;
      text-align: right;
    }
    .print-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    @media print {
      .print-btn-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="brand">
      <h1>Lyka Realty - Lead Qualification Report</h1>
      <p>Executive Lead Stated Details & Conversation Analysis</p>
    </div>
    <div class="meta-box">
      <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
      <div><strong>Filter Applied:</strong> ${dateLabel}</div>
      <div><strong>Total Records:</strong> ${totalCalls} calls</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-label">Total Calls</div>
      <div class="kpi-val">${totalCalls}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">🔥 HOT Leads</div>
      <div class="kpi-val" style="color: #dc2626;">${hotCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">☀️ WARM Leads</div>
      <div class="kpi-val" style="color: #d97706;">${warmCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">❄️ COLD Leads</div>
      <div class="kpi-val" style="color: #2563eb;">${coldCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Customer</th>
        <th style="width: 12%;">Status</th>
        <th style="width: 25%;">Customer Stated Requirements</th>
        <th style="width: 33%;">Conversation Summary & Stated Details</th>
        <th style="width: 12%;">Next Action</th>
      </tr>
    </thead>
    <tbody>
      ${calls.map((c) => {
        const badgeClass =
          c.outcome === 'HOT'
            ? 'badge-hot'
            : c.outcome === 'WARM'
            ? 'badge-warm'
            : 'badge-cold';

        return `
          <tr>
            <td>
              <div class="customer-name">${c.leadName}</div>
              <div class="customer-phone">${c.leadPhone}</div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
                ${c.startedAt ? c.startedAt.slice(0, 10) : ''} (${c.duration}s)
              </div>
            </td>
            <td>
              <span class="${badgeClass}">${c.outcome || 'COLD'}</span>
            </td>
            <td>
              <div><strong>Budget:</strong> ${c.budget || 'Not specified'}</div>
              <div><strong>Type:</strong> ${c.propertyType || 'Apartment / Villa'}</div>
              <div><strong>Location:</strong> ${c.location || 'Chennai'}</div>
              <div><strong>Timeline:</strong> ${c.timeline || 'Exploring'}</div>
            </td>
            <td>
              <div style="font-size: 11px; color: #334155;">${c.summary || 'Call finished.'}</div>
              ${c.transcript && c.transcript.length > 0 ? `
                <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic;">
                  "${c.transcript.find(t => t.role === 'user')?.text || ''}"
                </div>
              ` : ''}
            </td>
            <td style="font-size: 11px; color: #475569;">
              ${c.nextAction || 'Follow up'}
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>Lyka Realty Voice System &bull; Confidential Executive Report</div>
    <div>Generated: ${new Date().toLocaleString()}</div>
  </div>

  <script>
    // Automatically trigger print dialog on render
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

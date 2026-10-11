import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { parseLeadsCsv, ParsedCsvRow } from '../utils/csv';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: ParsedCsvRow[]) => void;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setCsvText(content);
      processCsv(content);
    };
    reader.readAsText(file);
  };

  const processCsv = (content: string) => {
    const result = parseLeadsCsv(content);
    setParsedRows(result.records);
    setValidationErrors(result.errors);
    setHasParsed(true);
  };

  const handleManualParse = () => {
    if (!csvText.trim()) return;
    processCsv(csvText);
  };

  const handleLoadSampleCsv = () => {
    const sample = `name,phone,email,source,consent
John Doe,+971500000001,john@example.com,Website,true
Jane Smith,+971500000002,jane@example.com,Campaign,true
David,+971500000003,david@example.com,Roadshow,true
Kavitha R,+919444123456,kavitha@example.com,Referral,true
Ahmed Al-Mansoori,+971509998877,ahmed@example.com,Property Finder,true`;

    setCsvText(sample);
    processCsv(sample);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Import Leads Dataset (CSV)
              </h3>
              <p className="text-[11px] text-slate-400">
                Validate and review contacts before initiating simulated AI calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Options */}
        <div className="space-y-3">
          {/* File input box */}
          <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-4 text-center transition-colors">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="csvFileInput"
              className="cursor-pointer flex flex-col items-center gap-1.5"
            >
              <FileSpreadsheet className="w-8 h-8 text-amber-400 opacity-80" />
              <span className="text-xs font-semibold text-slate-200">
                Click to upload a .csv file
              </span>
              <span className="text-[11px] text-slate-500">
                Supports columns: name, phone, email, source, consent
              </span>
            </label>
          </div>

          {/* Sample CSV CTA */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleLoadSampleCsv}
              className="text-amber-400 hover:text-amber-300 underline text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>Paste 5 Sample Real Estate Leads</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              Phone number is required
            </span>
          </div>

          {/* Raw Text Input Area */}
          <div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste raw CSV content here...&#10;name,phone,email,source,consent&#10;John Doe,+971500000001,john@example.com,Website,true"
              className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            {csvText && !hasParsed && (
              <button
                type="button"
                onClick={handleManualParse}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Validate &amp; Parse CSV
              </button>
            )}
          </div>
        </div>

        {/* Validation Feedback & Preview */}
        {hasParsed && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Validation Errors if any */}
            {validationErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1 max-h-32 overflow-y-auto">
                <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Validation Notices ({validationErrors.length})</span>
                </div>
                {validationErrors.map((err, idx) => (
                  <p key={idx} className="text-[11px] text-rose-300/80">
                    • {err}
                  </p>
                ))}
              </div>
            )}

            {/* Valid Records Summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{parsedRows.length} Valid Leads Ready to Import</span>
              </span>
              <span className="text-[10px] text-slate-500">
                Will be added to browser database
              </span>
            </div>

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0">
                    <tr>
                      <th className="py-1.5 px-2">Name</th>
                      <th className="py-1.5 px-2">Phone</th>
                      <th className="py-1.5 px-2">Source</th>
                      <th className="py-1.5 px-2">Consent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-850">
                        <td className="py-1 px-2 font-medium text-slate-100">{row.name}</td>
                        <td className="py-1 px-2 font-mono text-slate-300">{row.phone}</td>
                        <td className="py-1 px-2">{row.source || 'CSV'}</td>
                        <td className="py-1 px-2">
                          <span
                            className={
                              row.consent ? 'text-emerald-400' : 'text-slate-500'
                            }
                          >
                            {row.consent ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            className="px-4 py-2 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/15"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import {parsedRows.length} Leads</span>
          </button>
        </div>
      </div>
    </div>
  );
};

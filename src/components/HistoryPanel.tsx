/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Trash2, Calendar, FileSpreadsheet, Eye, Info } from 'lucide-react';

export interface HistoryItem {
  id: string;
  timestamp: string;
  title: string;
  wordCount: number;
  mlLabel: 'Real' | 'Fake';
  mlConfidence: number;
  geminiVerdict: string;
  fullData?: any;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClearHistory,
  onSelectHistoryItem,
  onNotification
}) => {

  const handleExportCSV = () => {
    if (history.length === 0) {
      onNotification('warning', 'History log is empty. Analyze some news articles to export records.');
      return;
    }

    // Prepare CSV header and rows
    const headers = ['ID', 'Timestamp', 'News Headline', 'Word Count', 'Traditional ML Label', 'Traditional ML Confidence', 'Gemini AI Verdict'];
    
    const rows = history.map((item, idx) => [
      item.id,
      item.timestamp,
      // Wrap in quotes and escape internal quotes to prevent CSV cell breakage
      `"${item.title.replace(/"/g, '""')}"`,
      item.wordCount,
      item.mlLabel,
      `${item.mlConfidence}%`,
      item.geminiVerdict || 'Not Run'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fake_News_Detector_History_${Date.now()}.csv`;
    link.click();
    
    onNotification('success', 'History log exported to CSV successfully.');
  };

  return (
    <div id="history-panel-card" className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="text-blue-400 w-5 h-5" />
          <h3 className="text-base font-semibold text-gray-100">Session Analysis History Registry</h3>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="text-xs flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export History (CSV)
          </button>
          
          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="text-xs flex items-center px-3 py-1.5 bg-gray-950 hover:bg-gray-850 border border-gray-850 hover:border-red-950 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear Log
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        This registry persists and records all news classifications you have performed. You can inspect, recall, or clear these logs at any time.
      </p>

      {history.length === 0 ? (
        <div id="history-empty" className="bg-gray-950 border border-gray-850 rounded-xl p-8 text-center text-gray-600">
          <FileSpreadsheet className="mx-auto w-10 h-10 mb-3 text-gray-800" />
          <p className="text-xs font-mono">No historical records in registry.</p>
          <p className="text-[10px] mt-1 text-gray-700">Records will accumulate automatically as you submit headlines and bodies for verification.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] font-mono uppercase text-gray-500 tracking-wider">
                <th className="py-2 px-3">Date/Time</th>
                <th className="py-2 px-3">Headline Title</th>
                <th className="py-2 px-3 text-center">Words</th>
                <th className="py-2 px-3">ML Label</th>
                <th className="py-2 px-3 text-center">ML Conf</th>
                <th className="py-2 px-3">GenAI Verdict</th>
                <th className="py-2 px-3 text-right">Recall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850 text-xs">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-950/40 transition-colors text-gray-300">
                  <td className="py-3 px-3 font-mono text-[10px] text-gray-500 whitespace-nowrap">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1.5" />
                      {item.timestamp}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-gray-200 max-w-xs truncate" title={item.title}>
                    {item.title}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-gray-400">
                    {item.wordCount}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                      item.mlLabel === 'Real' 
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                        : 'bg-red-950/40 text-red-400 border border-red-900/40'
                    }`}>
                      {item.mlLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold text-gray-100">
                    {item.mlConfidence}%
                  </td>
                  <td className="py-3 px-3">
                    {item.geminiVerdict ? (
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.geminiVerdict === 'Real' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                          : item.geminiVerdict === 'Fake' 
                          ? 'bg-red-950/40 text-red-400 border border-red-900/40'
                          : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                      }`}>
                        {item.geminiVerdict}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-600 font-mono italic">Not Run</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        onSelectHistoryItem(item);
                        onNotification('success', 'History news item recalled. View the active tabs!');
                      }}
                      className="inline-flex items-center px-2 py-1 bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 rounded text-[10px] text-gray-400 hover:text-gray-200 cursor-pointer"
                      title="Recall report details"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Recall
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Export Instructions */}
      <div className="bg-gray-950/60 border border-gray-850 rounded-lg p-3 text-[10px] text-gray-500 leading-relaxed mt-5 flex items-start space-x-2">
        <Info className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
        <span>
          <strong>Academic Demonstration Guideline:</strong> Exported CSV files contain clean comma-delimited logs containing prediction statistics, timestamps, and vocabulary indicators. This spreadsheet serves as primary trial evidence ready for project binder annexes and submission reports.
        </span>
      </div>
    </div>
  );
};

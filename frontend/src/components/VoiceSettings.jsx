import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ttsService from '../services/textToSpeechService';

export default function VoiceSettings() {
  const { lang } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Load TTS settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tts_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      setTtsEnabled(settings.enabled !== false);
      setSpeechRate(settings.speechRate || 1);
    }
  }, []);

  // Save TTS settings to localStorage
  const saveSettings = (enabled, rate) => {
    const settings = { enabled, speechRate: rate };
    localStorage.setItem('tts_settings', JSON.stringify(settings));
  };

  const handleToggleTTS = () => {
    const newValue = !ttsEnabled;
    setTtsEnabled(newValue);
    saveSettings(newValue, speechRate);
  };

  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setSpeechRate(newRate);
    saveSettings(ttsEnabled, newRate);
  };

  const handleGetLogs = () => {
    const allLogs = ttsService.getLogs();
    setLogs(allLogs);
    setShowLogs(true);
  };

  const handleExportLogs = () => {
    const logsJson = ttsService.exportLogs();
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(logsJson)}`);
    element.setAttribute('download', `tts-logs-${new Date().toISOString()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearLogs = () => {
    ttsService.clearLogs();
    setLogs([]);
    setShowLogs(false);
  };

  const handleStopSpeech = () => {
    ttsService.stop();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        title="Voice Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 w-72 p-5 space-y-4">
          <h3 className="font-bold text-gray-800 text-lg">Voice Settings</h3>

          {/* TTS Enable/Disable */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Text-to-Speech
            </label>
            <button
              onClick={handleToggleTTS}
              className={`w-12 h-7 rounded-full transition-colors ${
                ttsEnabled ? 'bg-teal-500' : 'bg-gray-300'
              } flex items-center p-1`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${ttsEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Speech Rate Control */}
          {ttsEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Speech Rate: {speechRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={handleRateChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow (0.5x)</span>
                <span>Normal (1x)</span>
                <span>Fast (2x)</span>
              </div>
            </div>
          )}

          {/* Stop Speech Button */}
          <button
            onClick={handleStopSpeech}
            className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Stop Current Speech
          </button>

          {/* Logs Management */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">Data Logging</p>
            <button
              onClick={handleGetLogs}
              className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              View Logs ({ttsService.getLogs().length})
            </button>
            {logs.length > 0 && (
              <>
                <button
                  onClick={handleExportLogs}
                  className="w-full px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Export Logs as JSON
                </button>
                <button
                  onClick={handleClearLogs}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear Logs
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Voice features work in {lang === 'np' ? 'Nepali' : 'English'}. Logs are recorded for presentation purposes and will be cleared on March 17, 2026.
            </p>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && logs.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Voice System Logs</h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-2 font-mono text-xs">
                {logs.map((log, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-600">
                      <strong>{log.timestamp}</strong> - {log.message}
                    </div>
                    {Object.keys(log.data).length > 0 && (
                      <pre className="text-gray-500 mt-1 overflow-auto text-xs">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-gray-200">
              <button
                onClick={handleExportLogs}
                className="flex-1 px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200"
              >
                Export as JSON
              </button>
              <button
                onClick={() => setShowLogs(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Presentation Logger
 * Records and exports voice system metrics for final presentation
 * Data will be cleared on March 17, 2026 when access expires
 */

class PresentationLogger {
  constructor() {
    this.sessions = [];
    this.startTime = new Date();
    this.initSession();
  }

  initSession() {
    const session = {
      id: Date.now(),
      startedAt: new Date().toISOString(),
      metrics: {
        totalSpeakActions: 0,
        totalListenActions: 0,
        totalErrors: 0,
        totalDuration: 0,
        languageBreaakdown: { en: 0, np: 0 },
        errorLog: [],
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
    };

    this.sessions.push(session);
    localStorage.setItem('presentation_session', JSON.stringify(session));
    console.log('🎯 Presentation logging session started:', session.id);

    this.logSystemInfo();
  }

  logSystemInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      event: 'System Initialized',
      data: {
        voiceAPISupported: !!window.speechSynthesis,
        speechRecognitionSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        audioContextSupported: !!(window.AudioContext || window.webkitAudioContext),
        browserVendor: navigator.vendor,
        browserVersion: navigator.appVersion,
      },
    };

    this.log(info);
  }

  log(entry) {
    const currentSession = this.sessions[this.sessions.length - 1];
    currentSession.log = currentSession.log || [];
    currentSession.log.push(entry);
    
    // Keep session localStorage in sync
    localStorage.setItem('presentation_session', JSON.stringify(currentSession));
  }

  recordSpeakAction(language, textLength, success = true) {
    const currentSession = this.sessions[this.sessions.length - 1];
    currentSession.metrics.totalSpeakActions++;
    currentSession.metrics.languageBreaakdown[language]++;

    this.log({
      timestamp: new Date().toISOString(),
      event: 'Speak Action',
      language,
      textLength,
      success,
    });
  }

  recordListenAction(language, transcriptLength, success = true) {
    const currentSession = this.sessions[this.sessions.length - 1];
    currentSession.metrics.totalListenActions++;
    currentSession.metrics.languageBreaakdown[language]++;

    this.log({
      timestamp: new Date().toISOString(),
      event: 'Listen Action',
      language,
      transcriptLength,
      success,
    });
  }

  recordError(errorType, errorMessage, context = {}) {
    const currentSession = this.sessions[this.sessions.length - 1];
    currentSession.metrics.totalErrors++;
    currentSession.metrics.errorLog.push({
      type: errorType,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    this.log({
      timestamp: new Date().toISOString(),
      event: 'Error Recorded',
      errorType,
      errorMessage,
      context,
    });
  }

  getSessionSummary() {
    return {
      totalSessions: this.sessions.length,
      currentSession: this.sessions[this.sessions.length - 1],
      uptime: new Date(Date.now() - new Date(this.startTime).getTime()),
    };
  }

  exportPresentationData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      expiresAt: '2026-03-17T00:00:00Z',
      notice: 'All voice system data recorded for demonstration. This data will be automatically cleared on March 17, 2026.',
      sessions: this.sessions,
      summary: {
        totalSessions: this.sessions.length,
        totalSpeakActions: this.sessions.reduce((sum, s) => sum + s.metrics.totalSpeakActions, 0),
        totalListenActions: this.sessions.reduce((sum, s) => sum + s.metrics.totalListenActions, 0),
        totalErrors: this.sessions.reduce((sum, s) => sum + s.metrics.totalErrors, 0),
        languagesUsed: this.sessions.reduce(
          (acc, s) => ({
            en: acc.en + s.metrics.languageBreaakdown.en,
            np: acc.np + s.metrics.languageBreaakdown.np,
          }),
          { en: 0, np: 0 }
        ),
      },
    };

    return exportData;
  }

  downloadPresentation Data() {
    const data = this.exportPresentationData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-system-presentation-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📊 Presentation data exported successfully');
  }

  /**
   * Auto-clear logs on March 17, 2026
   * This is called on app initialization
   */
  static checkAndClearOnExpiry() {
    const expiryDate = new Date('2026-03-17T00:00:00Z');
    const currentDate = new Date();

    if (currentDate >= expiryDate) {
      console.warn('⚠️ Access expiration date reached. Clearing all voice system logs.');
      localStorage.removeItem('presentation_session');
      return true;
    }

    return false;
  }
}

export const presentationLogger = new PresentationLogger();

// Auto-check expiry on module load
PresentationLogger.checkAndClearOnExpiry();

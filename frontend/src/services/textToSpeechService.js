/**
 * Text-to-Speech Service
 * Supports both browser's Web Speech API and external TTS services
 * Handles English and Nepali languages with proper error handling
 */

// Language-specific voice configurations
const VOICE_CONFIGS = {
  en: {
    lang: 'en-US',
    rate: 1,
    pitch: 1,
    volume: 1,
  },
  np: {
    lang: 'ne-NP',
    rate: 0.9,
    pitch: 1,
    volume: 1,
  },
};

class TextToSpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isSupported = !!this.synthesis;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.queue = [];
    this.logs = [];
    this.voicesLoaded = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Wait for voices to load
    if (this.isSupported) {
      this.loadVoices();
      // Some browsers load voices asynchronously
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
    
    this.logEvent('TTS Service initialized', { supported: this.isSupported });
  }

  /**
   * Load available voices
   */
  loadVoices() {
    try {
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        this.logEvent('Voices loaded', { count: voices.length });
      }
    } catch (error) {
      this.logEvent('Error loading voices', { error: error.message });
    }
  }

  /**
   * Log events for debugging and presentation
   */
  logEvent(message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    this.logs.push(logEntry);
    console.log(`🔊 [TTS] ${message}`, data);

    // Keep only last 100 logs for performance
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  /**
   * Get all recorded logs (for presentation before access is revoked)
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Export logs as JSON for presentation
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Speak text using Web Speech API
   * Supports both English and Nepali
   */
  async speak(text, language = 'en', options = {}) {
    if (!this.isSupported) {
      this.logEvent('TTS not supported in this browser', { text, language });
      throw new Error('Text-to-Speech is not supported in this browser.');
    }

    if (!text || text.trim() === '') {
      this.logEvent('Empty text provided to speak', { language });
      return Promise.resolve();
    }

    // Normalize language code
    const lang = language === 'np' ? 'np' : 'en';
    const voiceConfig = VOICE_CONFIGS[lang];

    try {
      // Ensure voices are loaded (especially for WebKit browsers)
      if (!this.voicesLoaded) {
        await this.waitForVoices();
      }

      // Create utterance with proper configuration
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceConfig.lang;
      utterance.rate = Math.max(0.5, Math.min(2.0, options.rate || voiceConfig.rate));
      utterance.pitch = Math.max(0.5, Math.min(2.0, options.pitch || voiceConfig.pitch));
      utterance.volume = Math.max(0, Math.min(1, options.volume || voiceConfig.volume));

      // Attempt to find voice for the language
      const voices = this.synthesis.getVoices();
      if (voices && voices.length > 0) {
        const targetVoice = voices.find((v) => v.lang.startsWith(lang === 'np' ? 'ne' : 'en'));
        if (targetVoice) {
          utterance.voice = targetVoice;
        } else {
          // Fallback to first voice if target not found
          utterance.voice = voices[0];
          this.logEvent('Target voice not found, using fallback', { language: lang, fallbackLang: voices[0].lang });
        }
      }

      // Cancel any ongoing speech
      if (this.isPlaying) {
        this.synthesis.cancel();
      }

      return new Promise((resolve, reject) => {
        // Set up event handlers
        utterance.onstart = () => {
          this.isPlaying = true;
          this.currentUtterance = utterance;
          this.retryCount = 0; // Reset retry count on successful start
          this.logEvent('Speech started', { language: lang, textLength: text.length });
          if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
          this.isPlaying = false;
          this.currentUtterance = null;
          this.logEvent('Speech ended', { language: lang });
          if (options.onEnd) options.onEnd();
          this.procesQueue();
          resolve();
        };

        utterance.onerror = (event) => {
          this.isPlaying = false;
          this.currentUtterance = null;
          
          // Specific handling for synthesis-failed error
          if (event.error === 'synthesis-failed' && this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.logEvent('Speech synthesis failed, retrying...', { 
              language: lang, 
              error: event.error,
              retryAttempt: this.retryCount 
            });
            
            // Retry after a short delay
            setTimeout(() => {
              this.speak(text, language, { ...options, queue: false })
                .then(() => resolve())
                .catch((err) => reject(err));
            }, 100 * this.retryCount);
            
            return;
          }

          // Log non-retriable errors
          this.logEvent('Speech error', { language: lang, error: event.error });
          
          const errorMessage = this.getErrorMessage(event.error);
          const error = new Error(errorMessage);
          
          if (options.onError) {
            options.onError(error);
          }
          
          reject(error);
        };

        utterance.onpause = () => {
          this.logEvent('Speech paused', { language: lang });
        };

        utterance.onresume = () => {
          this.logEvent('Speech resumed', { language: lang });
        };

        // Queue or speak immediately
        if (options.queue !== false && this.isPlaying) {
          this.queue.push({ utterance, options, resolve, reject });
          this.logEvent('Speech queued', { language: lang, queueLength: this.queue.length });
          return;
        }

        // Add a small delay to ensure system is ready (helps with WebKit)
        setTimeout(() => {
          try {
            this.synthesis.speak(utterance);
            this.logEvent('Speech request sent', {
              language: lang,
              textLength: text.length,
              rate: utterance.rate,
              pitch: utterance.pitch,
            });
          } catch (err) {
            this.logEvent('Error speaking', { error: err.message, language: lang });
            reject(err);
          }
        }, 10);
      });
    } catch (error) {
      this.logEvent('Error in speak method', { error: error.message, language: lang, text: text.substring(0, 50) });
      throw error;
    }
  }

  /**
   * Wait for voices to be loaded (especially important for WebKit)
   */
  async waitForVoices() {
    return new Promise((resolve) => {
      const maxAttempts = 50;
      let attempts = 0;

      const checkVoices = () => {
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          resolve();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkVoices, 50);
        } else {
          this.logEvent('Timeout waiting for voices', { attempts });
          this.voicesLoaded = true; // Proceed anyway
          resolve();
        }
      };

      checkVoices();
    });
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    const errorMap = {
      'synthesis-failed': 'Speech synthesis encountered an error. Please try again.',
      'canceled': 'Speech was canceled.',
      'network': 'Network error occurred during speech synthesis.',
      'not-allowed': 'Speech synthesis permission was denied.',
      'invalid-argument': 'Invalid speech parameters provided.',
      'audio-busy': 'Audio system is currently busy. Try again in a moment.',
      'network-timeout': 'Speech synthesis network request timed out.',
    };

    return errorMap[error] || `Speech synthesis error: ${error}`;
  }

  /**
   * Process queued speech items
   */
  procesQueue() {
    if (this.queue.length > 0 && !this.isPlaying) {
      const nextItem = this.queue.shift();
      try {
        const { utterance, resolve, reject } = nextItem;
        
        // Set up error handler for queued items
        utterance.onerror = (event) => {
          this.isPlaying = false;
          this.currentUtterance = null;
          this.logEvent('Queued speech error', { error: event.error });
          
          if (event.error === 'synthesis-failed' && this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => {
              this.procesQueue();
            }, 100 * this.retryCount);
            return;
          }
          
          reject(new Error(this.getErrorMessage(event.error)));
        };

        utterance.onend = () => {
          this.isPlaying = false;
          this.currentUtterance = null;
          this.logEvent('Queued speech ended', {});
          resolve();
          this.procesQueue();
        };

        this.synthesis.speak(utterance);
        this.logEvent('Processing queued speech', { queueLength: this.queue.length });
      } catch (error) {
        this.logEvent('Error processing queue', { error: error.message });
        // Continue to next item if current fails
        if (this.queue.length > 0) {
          this.procesQueue();
        }
      }
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.isPlaying) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.currentUtterance = null;
      this.queue = [];
      this.logEvent('Speech stopped by user');
    }
  }

  /**
   * Pause speech (if supported)
   */
  pause() {
    if (this.isPlaying && this.synthesis.pause) {
      this.synthesis.pause();
      this.logEvent('Speech paused');
    }
  }

  /**
   * Resume speech (if supported)
   */
  resume() {
    if (this.synthesis.resume) {
      this.synthesis.resume();
      this.logEvent('Speech resumed');
    }
  }

  /**
   * Check if TTS is currently playing
   */
  isCurrentlySpeaking() {
    return this.isPlaying;
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language = 'en') {
    const voices = this.synthesis.getVoices();
    const lang = language === 'np' ? 'ne' : 'en';
    return voices.filter((v) => v.lang.startsWith(lang));
  }

  /**
   * Speak with proper fallback system
   * Tries Web Speech API first, then external API if configured
   */
  async speakWithFallback(text, language = 'en', options = {}) {
    try {
      // Always try Web Speech API first (most reliable)
      await this.speak(text, language, options);
      return;
    } catch (error) {
      this.logEvent('Web Speech API failed, attempting fallback', {
        error: error.message,
        language,
      });

      // Check if external API is configured
      const apiKey = import.meta.env.VITE_TTS_API_KEY;
      const endpoint = import.meta.env.VITE_TTS_API_ENDPOINT;
      
      if (!apiKey || !endpoint) {
        // No external API, re-throw the Web Speech error
        throw new Error(
          'Voice synthesis failed. Please check your browser settings, speaker volume, and microphone permissions.'
        );
      }

      // Try external API as fallback
      try {
        await this.speakWithExternalAPI(text, language, apiKey, endpoint, options);
      } catch (fallbackError) {
        this.logEvent('Both Web Speech and external API failed', {
          webSpeechError: error.message,
          externalApiError: fallbackError.message,
        });
        throw new Error('Voice synthesis services are temporarily unavailable. Please try again later.');
      }
    }
  }

  /**
   * Speak using external API (Azure Speech Services)
   * Implements try-catch for 429 and 500 errors
   */
  async speakWithExternalAPI(text, language = 'en', apiKey, endpoint, options = {}) {
    try {
      const lang = language === 'np' ? 'ne-NP' : 'en-US';

      this.logEvent('Attempting external TTS API (Azure Speech Services)', {
        language: lang,
        textLength: text.length,
        endpoint: endpoint?.substring(0, 50) + '...',
      });

      // Make request to Azure Speech Services
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'opus-16khz-16bit-mono',
        },
        body: this.createSSML(text, lang),
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        const errorMsg = 'Too many TTS requests. Please wait a moment before trying again.';
        this.logEvent('Rate limit error (429)', { language: lang });
        throw new Error(errorMsg);
      }

      // Handle server error (500)
      if (response.status === 500) {
        const errorMsg = 'TTS service temporarily unavailable. Retrying with Web Speech API...';
        this.logEvent('Server error (500) - falling back to Web Speech', { language: lang });
        throw new Error(errorMsg);
      }

      // Handle other errors
      if (!response.ok) {
        const errorMsg = `TTS service error (${response.status}): ${response.statusText}`;
        this.logEvent('API error', { status: response.status, language: lang });
        throw new Error(errorMsg);
      }

      const audioBuffer = await response.arrayBuffer();

      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error('No audio content in API response');
      }

      // Play audio through Web Audio API
      await this.playAudioBuffer(audioBuffer, options, lang);
    } catch (error) {
      this.logEvent('External API error', {
        error: error.message,
        language,
      });

      if (error.message.includes('Too many TTS requests')) {
        // Implement backoff for 429 errors
        const retryDelay = options.retryDelay || 5000;
        this.logEvent('Scheduling retry after rate limit', { retryDelay });
        if (options.onRetry) {
          setTimeout(() => options.onRetry(), retryDelay);
        }
      }

      throw error;
    }
  }

  /**
   * Create SSML for Azure Speech Services
   */
  createSSML(text, language) {
    const voiceMap = {
      'en-US': 'en-US-AriaNeural',
      'ne-NP': 'ne-NP-HemkalaNeural', // May not be available, fallback used
    };

    const voice = voiceMap[language] || 'en-US-AriaNeural';
    const rate = language === 'ne-NP' ? '-10%' : '0%'; // Slightly slower for Nepali

    return `<speak version='1.0' xml:lang='${language}'>
      <voice name='${voice}'>
        <prosody rate='${rate}' pitch='0%'>
          ${this.escapeXML(text)}
        </prosody>
      </voice>
    </speak>`;
  }

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Play audio buffer using Web Audio API
   */
  async playAudioBuffer(audioBuffer, options, language) {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        audioContext.decodeAudioData(
          audioBuffer,
          (buffer) => {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);

            this.isPlaying = true;
            if (options.onStart) options.onStart();

            source.onended = () => {
              this.isPlaying = false;
              this.logEvent('External API audio playback ended', { language });
              if (options.onEnd) options.onEnd();
              this.procesQueue();
              resolve();
            };

            source.start(0);
            this.logEvent('External API audio playback started', { language });
          },
          (error) => {
            this.logEvent('Audio decode error', { error: error.message, language });
            reject(new Error('Failed to decode audio data'));
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clear all logs (useful for cleanup)
   */
  clearLogs() {
    this.logs = [];
    this.logEvent('Logs cleared');
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;

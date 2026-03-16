import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MessageBubble from './MessageBubble';
import VoiceButton from './VoiceButton';
import { submitTriage, getHealthPosts } from '../services/triageService';
import { generateImage, analyzeImage, processPDF, fileToBase64, getLocalRateLimitStatus } from '../services/imageService';

const RISK_TO_FACILITY_TYPE = {
  HIGH:   'hospital',
  MEDIUM: 'pharmacy',
  LOW:    'clinic',
};

export default function ChatWindow({ onConsultationSubmitted, conversationId, onConversationIdChange, district }) {
  const {
    t, location, messages, addMessage,
    loading, setLoading,
    setRecommendedFacilityType, setRecommendedFacilities,
  } = useApp();

  const [input, setInput]                 = useState('');
  const [localConversationId, setLocalConversationId] = useState(conversationId);
  const bottomRef                         = useRef(null);
  const abortControllerRef               = useRef(null);
  const textareaRef                       = useRef(null);
  const imageInputRef                     = useRef(null);

  // Image features state
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [selectedImageForAnalysis, setSelectedImageForAnalysis] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    setLocalConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMessage({ role: 'user', text });
    setLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const result = await submitTriage(
        text, location?.lat ?? null, location?.lng ?? null,
        abortControllerRef.current.signal,
        localConversationId,
        district
      );
      
      // Update conversation ID if returned from backend (for new conversations)
      if (result.conversation_id && !localConversationId) {
        setLocalConversationId(result.conversation_id);
        if (onConversationIdChange) {
          onConversationIdChange(result.conversation_id);
        }
      }
      
      const recommendedType = RISK_TO_FACILITY_TYPE[result?.risk] || 'clinic';
      let facilities = [];
      if (location?.lat != null && location?.lng != null) {
        facilities = await getHealthPosts(location.lat, location.lng, recommendedType, 10);
      }
      setRecommendedFacilityType(recommendedType);
      setRecommendedFacilities(Array.isArray(facilities) ? facilities : []);
      addMessage({
        role: 'ai',
        text: result.brief_advice || 'Analysis complete.',
        triageResult: {
          ...result,
          recommended_facility_type: recommendedType,
          recommended_facilities: Array.isArray(facilities) ? facilities : [],
        },
      });
      
      // Refresh history after successful consultation submission
      if (onConsultationSubmitted) {
        onConsultationSubmitted();
      }
    } catch (error) {
      addMessage({
        role: 'ai',
        text: error.name === 'CanceledError' ? 'Request cancelled.' : `Error: ${error.message || t.errors.fetchFailed}`,
        error: true,
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel  = () => { abortControllerRef.current?.abort(); setLoading(false); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ── Image Generation Handler ──
  const handleGenerateImage = async () => {
    if (!imageGenPrompt.trim()) return;

    const status = getLocalRateLimitStatus();
    if (status.rateLimited) {
      addMessage({
        role: 'ai',
        text: `⏱️ Rate limit in effect. Please wait ${status.waitSeconds.toFixed(1)}s before generating another image. Image generation is limited to 3 requests per minute to protect API quota.`,
        error: true,
      });
      return;
    }

    setGeneratingImage(true);
    addMessage({ role: 'user', text: `🎨 Generate image: "${imageGenPrompt}"` });

    try {
      console.log('🎨 Generating image from prompt:', imageGenPrompt);
      const result = await generateImage(imageGenPrompt, '1024x1024', 'standard', 1);

      if (result.error) {
        // Better error messaging
        let errorMsg = `❌ Image generation failed`;
        if (result.error.includes('404')) {
          errorMsg += ': Endpoint not found. Please restart Django server with: python manage.py runserver';
        } else if (result.error.includes('Rate limit')) {
          errorMsg += ': Rate limit exceeded. Wait before trying again.';
        } else if (result.error.includes('401')) {
          errorMsg += ': Authentication failed. Check API key configuration.';
        } else {
          errorMsg += `: ${result.error}`;
        }
        
        addMessage({
          role: 'ai',
          text: errorMsg,
          error: true,
        });
      } else {
        const imageBase64 = result.images?.[0]?.b64_json;
        if (imageBase64) {
          // Clean the base64 string - remove any whitespace or newlines
          const cleanedBase64 = imageBase64.replace(/\s/g, '');
          const modelLabel = result.source || 'image_model';
          console.log('Image data received:', {
            originalLength: imageBase64.length,
            cleanedLength: cleanedBase64.length,
            startsWithPNG: cleanedBase64.startsWith('iVBORw0KGg'),
            dataUrlLength: (42 + cleanedBase64.length) // "data:image/png;base64," = 22 chars
          });
          
          addMessage({
            role: 'ai',
            text: `✅ Successfully generated medical image

**Prompt:** "${imageGenPrompt}"
**Model:** ${modelLabel}
**Size:** 1024×1024
**Quality:** Standard

This image has been saved locally for your records.`,
            imageData: {
              type: 'generated',
              base64: cleanedBase64,
              prompt: imageGenPrompt,
              source: 'image_generation',
            },
          });
        } else {
          addMessage({
            role: 'ai',
            text: `⚠️ Image was generated but couldn't be displayed. Please try again.`,
            error: true,
          });
        }
      }
    } catch (err) {
      console.error('❌ Image generation error:', err);
      addMessage({
        role: 'ai',
        text: `❌ Error generating image: ${err.message}\n\n**Troubleshooting:**
- Ensure Django server is running: \`python manage.py runserver\`
- Check that API endpoints are registered: \`python manage.py show_urls | grep image\`
- Verify AZURE_OPENAI_API_KEY is set in backend/.env`,
        error: true,
      });
    } finally {
      setGeneratingImage(false);
      setImageGenPrompt('');
      setShowImageGenerator(false);
    }
  };

  // ── Image Upload & Analysis Handler ──
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setSelectedImageForAnalysis(base64);

      // Add image to chat
      addMessage({
        role: 'user',
        text: `📸 Uploaded image: ${file.name}`,
        imageData: {
          type: 'uploaded',
          base64: base64,
          fileName: file.name,
        },
      });
    } catch (err) {
      addMessage({
        role: 'ai',
        text: `❌ Failed to read image: ${err.message}`,
        error: true,
      });
    }

    // Reset input
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ── PDF Upload Handler ──
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    addMessage({ role: 'user', text: `📄 Processing PDF: ${file.name}` });

    try {
      const result = await processPDF(file);

      if (result.error) {
        addMessage({
          role: 'ai',
          text: `❌ PDF processing failed: ${result.error}`,
          error: true,
        });
        return;
      }

      const textPreview = (result.text_content || [])
        .slice(0, 2)
        .map((page) => `- Page ${page.page}: ${(page.text || '').slice(0, 140)}${(page.text || '').length > 140 ? '...' : ''}`)
        .join('\n');

      addMessage({
        role: 'ai',
        text: `✅ PDF processed successfully: ${file.name}\n\nPages: ${result.total_pages || 0}\nExtracted images: ${(result.extracted_images || []).length}\n\nText preview:\n${textPreview || 'No extractable text found.'}`,
        metadata: {
          type: 'pdf_processed',
          fileName: file.name,
          totalPages: result.total_pages || 0,
          extractedImages: (result.extracted_images || []).length,
        },
      });

      const extractedImages = result.extracted_images || [];
      if (extractedImages.length > 0) {
        addMessage({
          role: 'ai',
          text: `🔍 Running medical analysis on ${extractedImages.length} extracted PDF page image(s)...`,
        });

        const pdfQuestion = 'Analyze this medical report image. Summarize key findings, possible concerns, and recommended next steps in simple language.';
        const pageReports = [];
        let analysisSource = 'vision_analysis';

        for (let index = 0; index < extractedImages.length; index += 1) {
          const pdfImagePath = extractedImages[index];
          try {
            const analysisResult = await analyzeImage(pdfImagePath, pdfQuestion);

            if (analysisResult?.error) {
              pageReports.push(`Page ${index + 1}:\nAnalysis failed: ${analysisResult.error}`);
            } else {
              analysisSource = analysisResult.source || analysisSource;
              const pageAnalysis = (analysisResult.analysis || '').trim() || 'No analysis returned.';
              pageReports.push(`Page ${index + 1}:\n${pageAnalysis}`);
            }
          } catch (analysisError) {
            pageReports.push(`Page ${index + 1}:\nAnalysis failed: ${analysisError.message}`);
          }
        }

        let overallConclusion = 'Overall Conclusion:\nCould not generate a consolidated summary from page analyses.';
        try {
          const summaryPrompt = [
            'Create a concise overall conclusion from these page-level medical report analyses.',
            'Return plain text with exactly these headings:',
            '1) Overall Summary',
            '2) Most Important Findings',
            '3) Immediate Next Steps',
            '',
            'Page analyses:',
            pageReports.join('\n\n')
          ].join('\n');

          const summaryResult = await analyzeImage(extractedImages[0], summaryPrompt);
          if (summaryResult?.analysis?.trim()) {
            overallConclusion = `Overall Conclusion:\n${summaryResult.analysis.trim()}`;
          }
        } catch (summaryError) {
          overallConclusion = `Overall Conclusion:\nUnable to generate consolidated summary (${summaryError.message}).`;
        }

        addMessage({
          role: 'ai',
          text: `💡 PDF Medical Analysis (All Pages)\n\n${overallConclusion}\n\nDetailed Page Findings:\n\n${pageReports.join('\n\n---\n\n')}\n\nSafety Note:\nThis is AI-generated support information, not a confirmed medical diagnosis. Please consult a licensed medical professional before making treatment decisions.`,
          metadata: {
            type: 'pdf_vision_analysis',
            source: analysisSource,
            fileName: file.name,
            pagesAnalyzed: extractedImages.length,
          },
        });
      }
    } catch (err) {
      addMessage({
        role: 'ai',
        text: `❌ Error processing PDF: ${err.message}`,
        error: true,
      });
    } finally {
      setLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  // ── Analyze Uploaded Image ──
  const handleAnalyzeImage = async (imageBase64, question) => {
    if (!imageBase64 || !question.trim()) {
      addMessage({
        role: 'ai',
        text: '❌ Please provide both an image and a question before analyzing.',
        error: true,
      });
      return;
    }

    setAnalyzingImage(true);
    addMessage({ role: 'user', text: `🔍 Medical Question: "${question}"` });

    try {
      console.log('🔍 Analyzing image with vision AI...');
      const result = await analyzeImage(imageBase64, question);

      if (result.error) {
        let errorMsg = `❌ Vision analysis failed`;
        if (result.error.includes('404')) {
          errorMsg += ': Endpoint not found. Please restart Django server.';
        } else {
          errorMsg += `: ${result.error}`;
        }
        
        addMessage({
          role: 'ai',
          text: errorMsg,
          error: true,
        });
      } else {
        const analysisText = (result.analysis || '').trim();
        addMessage({
          role: 'ai',
          text: `💡 Vision Analysis

Summary:
${analysisText || 'No analysis text returned.'}

Safety Note:
This is AI-generated support information, not a confirmed medical diagnosis. Please consult a licensed medical professional before making treatment decisions.`,
          metadata: {
            type: 'vision_analysis',
            source: 'azure_gpt_image_1_5_vision',
          },
        });
      }
    } catch (err) {
      console.error('❌ Analysis error:', err);
      addMessage({
        role: 'ai',
        text: `❌ Error during vision analysis: ${err.message}\n\n**Troubleshooting:**
- Ensure Django server is running
- Check AZURE_OPENAI_API_KEY is configured
- Verify image format (JPG, PNG supported)`,
        error: true,
      });
    } finally {
      setAnalyzingImage(false);
      setSelectedImageForAnalysis(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-4 bg-gray-100">

        {/* Welcome message */}
        <div className="flex justify-start mb-6 animate-slide-up">
          <div className="flex items-start gap-3 md:gap-4 max-w-3xl">
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0 shadow-md">
              H
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-sm px-4 md:px-6 py-3 md:py-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-gray-800 text-xs md:text-sm leading-relaxed font-medium">{t.chat.welcome}</p>
            </div>
          </div>
        </div>

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onAnalyzeImage={handleAnalyzeImage}
          />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0 shadow-md">
                H
              </div>
              <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-sm px-4 md:px-6 py-3 md:py-4 shadow-sm">
                <div className="flex gap-1.5 items-center py-1">
                  <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="bg-gray-100 border-t border-gray-300 px-4 md:px-6 lg:px-8 py-3 shadow-sm">
        {/* Quick symptom buttons - hidden on small screens & when messages exist */}
        {!messages.some(m => m.role === 'user') && (
          <div className="mb-3 hidden sm:block">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Quick Symptoms:</p>
            <div className="overflow-x-auto flex gap-2 pb-2 scrollbar-gray">
              {[
                'I have fever, headache and sore throat',
                'Chest pain and shortness of breath',
                'Severe stomach pain and nausea',
                'Persistent cough and body aches',
              ].map((symptom, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(symptom)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-teal-400 transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0"
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input container */}
        <div className="flex items-start gap-2 md:gap-3 bg-gray-50 border-2 border-gray-300 rounded-xl md:rounded-2xl px-4 md:px-5 py-2 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-400/20 transition-all duration-200 group hover:ring-2 hover:ring-gray-300/40">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.placeholder}
            disabled={loading}
            className="flex-1 bg-transparent resize-none outline-none text-sm md:text-base text-gray-800 placeholder-gray-500 max-h-32 leading-relaxed disabled:opacity-50 pt-2 font-medium"
          />
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 pt-2">
            {/* Image Generation Button */}
            <button
              onClick={() => setShowImageGenerator(!showImageGenerator)}
              disabled={loading || generatingImage}
              className="p-1 sm:p-2 md:p-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg md:rounded-xl transition-all duration-200 flex-shrink-0 min-h-[32px] sm:min-h-[40px] min-w-[32px] sm:min-w-[40px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate image with AI"
            >
              <svg className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Image Upload Button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={loading || analyzingImage}
              className="p-1 sm:p-2 md:p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg md:rounded-xl transition-all duration-200 flex-shrink-0 min-h-[32px] sm:min-h-[40px] min-w-[32px] sm:min-w-[40px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload image"
            >
              <svg className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <VoiceButton onTranscript={text => setInput(prev => prev + text)} disabled={loading} />
            {loading ? (
              <button
                onClick={handleCancel}
                className="p-2 md:p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg md:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Cancel"
              >
                <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 md:p-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg md:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-sm flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <svg className="w-4 md:w-5 h-4 md:h-5 rotate-90 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2 font-medium hidden sm:block">Press Enter to send · Shift+Enter for new line</p>
      </div>

      {/* ── Hidden File Inputs ── */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* ── Image Generation Modal ── */}
      {showImageGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">🎨 Generate Medical Image</h2>
              <button
                onClick={() => setShowImageGenerator(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {rateLimitInfo && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">⏱️ Rate Limit:</span> {rateLimitInfo.limit} requests/min
                </p>
              </div>
            )}

            <textarea
              value={imageGenPrompt}
              onChange={(e) => setImageGenPrompt(e.target.value)}
              placeholder="Describe the medical image you want to generate... (e.g., 'Doctor examining patient with stethoscope')"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              rows="4"
              disabled={generatingImage}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowImageGenerator(false)}
                disabled={generatingImage}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage || !imageGenPrompt.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {generatingImage ? '⏳ Generating...' : '🎨 Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

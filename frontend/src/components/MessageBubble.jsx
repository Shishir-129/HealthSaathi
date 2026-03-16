import React, { useState } from 'react';
import RiskCard from './RiskCard';
import SpeakButton from './SpeakButton';

export default function MessageBubble({ message, onAnalyzeImage }) {
  const { role, text, triageResult, error, imageData, metadata } = message;
  const isUser = role === 'user';
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);
  const [analysisQuestion, setAnalysisQuestion] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  const inferMimeType = (value) => {
    if (!value) return 'image/png';
    const signature = value.slice(0, 20);
    if (signature.startsWith('/9j/')) return 'image/jpeg';
    if (signature.startsWith('iVBORw0KGgo')) return 'image/png';
    if (signature.startsWith('R0lGOD')) return 'image/gif';
    if (signature.startsWith('UklGR')) return 'image/webp';
    return 'image/png';
  };

  const resolvedMimeType = inferMimeType(imageData?.base64);
  const imageSrc = imageData?.base64?.startsWith('data:')
    ? imageData.base64
    : imageData?.base64
    ? `data:${resolvedMimeType};base64,${imageData.base64}`
    : null;

  const handleImageError = () => {
    console.error('Image failed to load:', {
      base64Length: imageData?.base64?.length,
      base64Start: imageData?.base64?.substring(0, 50),
      dataUrl: imageSrc?.substring(0, 100)
    });
    setImageLoadError(true);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 md:w-11 h-8 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs md:text-sm font-bold mr-2 md:mr-3 flex-shrink-0 mt-0.5 shadow-md">
          H
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] space-y-3`}>
        {/* Text bubble */}
        <div
          className={`px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-sm leading-relaxed font-medium whitespace-pre-wrap break-words transition-all ${
            isUser
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-tr-sm shadow-md hover:shadow-lg'
              : error
              ? 'bg-red-50 text-red-700 border border-red-300 rounded-tl-sm'
              : 'bg-white text-gray-800 shadow-sm border border-emerald-200 rounded-tl-sm hover:shadow-md hover:border-emerald-300'
          }`}
        >
          {text}
        </div>

        {/* Image Display */}
        {imageData && imageData.base64 && (
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            {!imageLoadError ? (
              <img
                src={imageSrc}
                alt="Message image"
                className="w-full h-auto max-h-96 object-contain"
                onError={handleImageError}
              />
            ) : (
              <div className="bg-red-50 p-4 text-red-700 text-sm">
                <p className="font-semibold mb-2">❌ Image failed to load</p>
                <p className="text-xs text-red-600">Base64 data: {imageData.base64?.length} characters</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-mono">Debug Info</summary>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto">
{JSON.stringify({
  type: imageData.type,
  base64Start: imageData.base64?.substring(0, 50),
  base64Length: imageData.base64?.length,
  dataUrlStart: imageSrc?.substring(0, 80)
}, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            {imageData.type === 'generated' && (
              <div className="p-3 bg-purple-50 border-t border-gray-300">
                <p className="text-xs text-gray-600 mb-2">
                  <span className="font-semibold">Generated from:</span> {imageData.prompt}
                </p>
                <button
                  onClick={() => setShowImageAnalysis(!showImageAnalysis)}
                  className="text-xs px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                >
                  🔍 Analyze This Image
                </button>
              </div>
            )}
            {imageData.type === 'uploaded' && (
              <div className="p-3 bg-blue-50 border-t border-gray-300">
                <p className="text-xs text-gray-600 mb-2">
                  <span className="font-semibold">File:</span> {imageData.fileName}
                </p>
                <button
                  onClick={() => setShowImageAnalysis(!showImageAnalysis)}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  🔍 Analyze This Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Image Analysis Form */}
        {showImageAnalysis && imageData && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 space-y-2">
            <textarea
              value={analysisQuestion}
              onChange={(e) => setAnalysisQuestion(e.target.value)}
              placeholder="Ask a question about this image... (e.g., 'What symptoms are visible?')"
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-xs focus:ring-2 focus:ring-yellow-500"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowImageAnalysis(false);
                  setAnalysisQuestion('');
                }}
                className="flex-1 text-xs px-2 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!onAnalyzeImage) return;
                  const imageSource = imageData?.base64 || '';
                  onAnalyzeImage(imageSource, analysisQuestion);
                  setShowImageAnalysis(false);
                  setAnalysisQuestion('');
                }}
                className="flex-1 text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
              >
                Analyze
              </button>
            </div>
          </div>
        )}

        {/* Speak button (AI only) */}
        {!isUser && !error && <SpeakButton text={text} />}

        {/* Triage result card (AI only) */}
        {triageResult && (
          <RiskCard
            risk={triageResult.risk}
            advice={triageResult.brief_advice || triageResult.advice}
            action={triageResult.action}
            nepaliAdvice={triageResult.nepali_advice}
            nearestPost={triageResult.recommended_facilities?.[0] || triageResult.nearest_post}
            recommendedFacilityType={triageResult.recommended_facility_type}
            triageResult={triageResult}
          />
        )}
      </div>

      {isUser && (
        <div className="w-8 md:w-11 h-8 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs md:text-sm font-bold ml-2 md:ml-3 flex-shrink-0 mt-0.5 shadow-md">
          You
        </div>
      )}
    </div>
  );
}

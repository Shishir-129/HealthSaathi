import React, { useState } from 'react';
import imageService from '../../services/imageService';

/**
 * ImageGenerator Component
 * Allows users to generate images from text prompts and analyze images using vision
 */
export default function ImageGenerator() {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'analyze', 'pdf'
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageQuality, setImageQuality] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  // Vision Analysis state
  const [visionImageSource, setVisionImageSource] = useState('');
  const [visionQuestion, setVisionQuestion] = useState('');
  const [visionResult, setVisionResult] = useState(null);

  // PDF processing state
  const [pdfPath, setPdfPath] = useState('');
  const [pdfResult, setPdfResult] = useState(null);

  // Logs state
  const [processingLogs, setProcessingLogs] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  /**
   * Handle image generation
   */
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check rate limit
      const rateLimitStatus = imageService.getLocalRateLimitStatus();
      setRateLimitInfo(rateLimitStatus);

      if (rateLimitStatus.rateLimited) {
        setError(`Rate limit active. Please wait ${rateLimitStatus.waitSeconds.toFixed(1)}s before generating another image.`);
        setLoading(false);
        return;
      }

      const result = await imageService.generateImage(
        prompt,
        imageSize,
        imageQuality,
        1
      );

      if (result.error) {
        setError(result.error);
      } else {
        setGeneratedImages([...generatedImages, result]);
        setPrompt('');
        console.log('✅ Image generated:', result);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate image');
      console.error('❌ Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle image analysis
   */
  const handleAnalyzeImage = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await imageService.analyzeImage(
        visionImageSource,
        visionQuestion
      );

      if (result.error) {
        setError(result.error);
      } else {
        setVisionResult(result);
        console.log('✅ Vision analysis completed:', result);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze image');
      console.error('❌ Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle PDF processing
   */
  const handleProcessPDF = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await imageService.processPDF(pdfPath);

      if (result.error) {
        setError(result.error);
      } else {
        setPdfResult(result);
        console.log('✅ PDF processed:', result);
      }
    } catch (err) {
      setError(err.message || 'Failed to process PDF');
      console.error('❌ PDF error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle file upload for image analysis
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await imageService.fileToBase64(file);
      setVisionImageSource(base64);
      setError(null);
    } catch (err) {
      setError('Failed to read image file');
      console.error('File read error:', err);
    }
  };

  /**
   * Download generated image
   */
  const handleDownloadImage = (imageUrl, index) => {
    try {
      imageService.downloadImage(imageUrl, `generated_image_${index}.png`);
    } catch (err) {
      setError('Failed to download image');
    }
  };

  /**
   * Fetch and display processing logs
   */
  const handleShowLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const logs = await imageService.getImageProcessingLogs();
      setProcessingLogs(logs);
      setShowLogs(true);
      console.log('✅ Logs retrieved:', logs);
    } catch (err) {
      setError(err.message || 'Failed to retrieve logs');
      console.error('❌ Logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎨 Image & Vision AI</h1>
        <p className="text-gray-600">Generate images from text, analyze images with vision AI, and process documents</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'generate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📸 Generate Image
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'analyze'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔍 Vision Analysis
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'pdf'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📄 Process PDF
        </button>
        <button
          onClick={handleShowLogs}
          className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 ml-auto"
        >
          📝 View Logs
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <span className="font-semibold">⚠️ Error:</span> {error}
        </div>
      )}

      {/* Rate Limit Info */}
      {rateLimitInfo && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
          <span className="font-semibold">⏱️ Rate Limit Status:</span>
          <ul className="mt-2 text-sm">
            <li>Limit: {rateLimitInfo.limit} requests per minute</li>
            <li>Min interval: {rateLimitInfo.minIntervalSeconds} seconds</li>
            <li>Rate limited: {rateLimitInfo.rateLimited ? 'Yes' : 'No'}</li>
            {rateLimitInfo.waitSeconds > 0 && (
              <li>Wait time: {rateLimitInfo.waitSeconds.toFixed(1)}s</li>
            )}
          </ul>
        </div>
      )}

      {/* IMAGE GENERATION TAB */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎨 Generate Image from Text</h2>

          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate... e.g., 'A doctor examining a patient in a medical clinic'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="1024x1024">1024x1024 (Square)</option>
                  <option value="1024x1792">1024x1792 (Portrait)</option>
                  <option value="1792x1024">1792x1024 (Landscape)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality
                </label>
                <select
                  value={imageQuality}
                  onChange={(e) => setImageQuality(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="standard">Standard</option>
                  <option value="hd">HD (Higher Quality)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? '⏳ Generating...' : '🎨 Generate Image'}
            </button>
          </form>

          {/* Generated Images Display */}
          {generatedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Generated Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedImages.map((imgResult, idx) => (
                  <div key={idx} className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Prompt:</strong> {imgResult.prompt.substring(0, 100)}...
                    </p>
                    {imgResult.images?.[0]?.b64_json && (
                      <div className="mb-4">
                        <img
                          src={`data:image/png;base64,${imgResult.images[0].b64_json}`}
                          alt="Generated"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                    {imgResult.images?.[0]?.local_path && (
                      <p className="text-xs text-gray-500 mb-2">
                        Saved: {imgResult.images[0].local_path}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        handleDownloadImage(
                          `data:image/png;base64,${imgResult.images?.[0]?.b64_json}`,
                          idx
                        )
                      }
                      className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      ⬇️ Download Image
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISION ANALYSIS TAB */}
      {activeTab === 'analyze' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔍 Analyze Image with Vision AI</h2>

          <form onSubmit={handleAnalyzeImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
              {visionImageSource && (
                <p className="text-sm text-green-600 mt-2">✅ Image loaded</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or Paste Base64/URL
              </label>
              <textarea
                value={visionImageSource}
                onChange={(e) => setVisionImageSource(e.target.value)}
                placeholder="Paste base64 image or image URL..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question About Image
              </label>
              <textarea
                value={visionQuestion}
                onChange={(e) => setVisionQuestion(e.target.value)}
                placeholder="What would you like to know about this image? e.g., 'What medical conditions might this symptom indicate?'"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !visionImageSource || !visionQuestion.trim()}
              className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? '⏳ Analyzing...' : '🔍 Analyze Image'}
            </button>
          </form>

          {/* Vision Result */}
          {visionResult && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis Result</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{visionResult.analysis}</p>
              <p className="text-xs text-gray-500 mt-4">
                Source: {visionResult.source} | Timestamp: {visionResult._timestamp}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PDF PROCESSING TAB */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 Process PDF Document</h2>

          <form onSubmit={handleProcessPDF} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF File Path
              </label>
              <input
                type="text"
                value={pdfPath}
                onChange={(e) => setPdfPath(e.target.value)}
                placeholder="/path/to/document.pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !pdfPath.trim()}
              className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? '⏳ Processing...' : '📄 Process PDF'}
            </button>
          </form>

          {/* PDF Result */}
          {pdfResult && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Processing Result</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded">
                  <p className="text-sm text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-blue-600">{pdfResult.total_pages}</p>
                </div>
                <div className="bg-white p-4 rounded">
                  <p className="text-sm text-gray-600">Images Extracted</p>
                  <p className="text-2xl font-bold text-green-600">{pdfResult.extracted_images?.length || 0}</p>
                </div>
              </div>

              {pdfResult.extracted_images?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">📸 Extracted Images</h4>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {pdfResult.extracted_images.map((imagePath, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-gray-300 text-sm text-gray-600">
                        <p className="truncate" title={imagePath}>Page {idx + 1}</p>
                        <p className="text-xs text-gray-500">{imagePath}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pdfResult.text_content?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">📝 Text Content Preview</h4>
                  <div className="bg-white p-4 rounded max-h-72 overflow-y-auto">
                    {pdfResult.text_content.slice(0, 3).map((page, idx) => (
                      <div key={idx} className="mb-4 pb-4 border-b last:border-b-0">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Page {page.page}</p>
                        <p className="text-sm text-gray-600">{page.text.substring(0, 200)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PROCESSING LOGS MODAL */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📝 Processing Logs</h2>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>
            </div>

            {processingLogs ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-sm text-gray-600">Generated</p>
                    <p className="text-xl font-bold text-blue-600">{processingLogs.generation?.length || 0}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded">
                    <p className="text-sm text-gray-600">Vision Analyses</p>
                    <p className="text-xl font-bold text-purple-600">{processingLogs.vision?.length || 0}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded">
                    <p className="text-sm text-gray-600">PDF Processed</p>
                    <p className="text-xl font-bold text-green-600">{processingLogs.pdf?.length || 0}</p>
                  </div>
                </div>

                <details className="bg-gray-100 p-4 rounded">
                  <summary className="font-semibold cursor-pointer">Raw Logs (JSON)</summary>
                  <pre className="mt-2 text-xs overflow-x-auto bg-white p-2 rounded">
                    {JSON.stringify(processingLogs, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-gray-600">Loading logs...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

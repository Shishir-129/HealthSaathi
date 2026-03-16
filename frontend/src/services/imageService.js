import apiClient from './api';

/**
 * Client-side rate limiter for image requests
 * Enforces 3 requests per minute (20 second minimum interval)
 */
class ImageRateLimiter {
  constructor(rpmLimit = 3, minIntervalSeconds = 20) {
    this.rpmLimit = rpmLimit;
    this.minIntervalSeconds = minIntervalSeconds;
    this.requestTimestamps = [];
    this.lastRequestTime = 0;
  }

  /**
   * Check if a request can be made without waiting
   * @returns {Object} {canMakeRequest: boolean, waitSeconds: number}
   */
  canMakeRequest() {
    const now = Date.now() / 1000;
    
    // Check minimum interval
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minIntervalSeconds) {
      return {
        canMakeRequest: false,
        waitSeconds: this.minIntervalSeconds - timeSinceLastRequest
      };
    }

    // Clean old timestamps outside the minute window
    const oneMinuteAgo = now - 60;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);

    // Check if we've exceeded limit in current window
    if (this.requestTimestamps.length >= this.rpmLimit) {
      const oldestRequest = this.requestTimestamps[0];
      const waitSeconds = 60 - (now - oldestRequest);
      return {
        canMakeRequest: false,
        waitSeconds: Math.max(0.1, waitSeconds)
      };
    }

    return { canMakeRequest: true, waitSeconds: 0 };
  }

  /**
   * Record a request and return wait time
   * @returns {Promise<number>} Actual wait time in seconds
   */
  async recordRequest() {
    const now = Date.now() / 1000;
    const check = this.canMakeRequest();

    if (!check.canMakeRequest) {
      console.warn(`⏱️ Rate limit: waiting ${check.waitSeconds.toFixed(2)}s`);
      await new Promise(resolve => setTimeout(resolve, check.waitSeconds * 1000));
    }

    const actualNow = Date.now() / 1000;
    this.requestTimestamps.push(actualNow);
    this.lastRequestTime = actualNow;

    return check.waitSeconds;
  }

  /**
   * Get current rate limit status
   * @returns {Object} Status information
   */
  getStatus() {
    const now = Date.now() / 1000;
    const check = this.canMakeRequest();
    
    // Clean old timestamps
    const oneMinuteAgo = now - 60;
    const recentRequests = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);

    return {
      limit: this.rpmLimit,
      minIntervalSeconds: this.minIntervalSeconds,
      recentRequestsInCurrentWindow: recentRequests.length,
      canMakeRequest: check.canMakeRequest,
      waitSeconds: check.waitSeconds,
      rateLimited: !check.canMakeRequest
    };
  }
}

// Create a single instance for the app
const imageRateLimiter = new ImageRateLimiter(3, 20);

/**
 * Generate an image from text prompt
 * @param {string} prompt - Text description of the image to generate
 * @param {string} size - Image size (1024x1024, 1024x1792, 1792x1024)
 * @param {string} quality - Image quality (standard or hd)
 * @param {number} n - Number of images to generate
 * @returns {Promise<Object>} Generated image data
 */
export async function generateImage(prompt, size = '1024x1024', quality = 'standard', n = 1) {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    console.log('⏳ Checking rate limit for image generation...');
    const waitTime = await imageRateLimiter.recordRequest();

    if (waitTime > 0) {
      console.log(`💤 Waited ${waitTime.toFixed(2)}s to respect rate limit`);
    }

    console.log('🎨 Generating image:', { prompt: prompt.substring(0, 100), size, quality });

    const payload = {
      prompt: prompt.trim(),
      size,
      quality,
      n: Math.min(n, 1) // API typically supports 1 per request
    };

    const response = await apiClient.post('/image/generate/', payload);
    console.log('✅ Image generated successfully:', response.data);
    
    // Debug logging for image data
    if (response.data.images && response.data.images.length > 0) {
      const img = response.data.images[0];
      console.log('Image data details:', {
        hasB64Json: !!img.b64_json,
        b64Length: img.b64_json?.length,
        b64Start: img.b64_json?.substring(0, 50),
        b64End: img.b64_json?.substring(img.b64_json.length - 20),
        hasPNGSignature: img.b64_json?.startsWith('iVBORw0KGg'),
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Image generation error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

/**
 * Analyze an image using vision capabilities
 * @param {string} imageSource - Base64 encoded image or URL
 * @param {string} question - Question or prompt about the image
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeImage(imageSource, question) {
  try {
    if (!imageSource || imageSource.trim().length === 0) {
      throw new Error('Image source cannot be empty');
    }

    if (!question || question.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }

    console.log('🔍 Analyzing image with question:', question.substring(0, 100));

    const payload = {
      image_source: imageSource.trim(),
      question: question.trim()
    };

    const response = await apiClient.post('/image/analyze/', payload);
    console.log('✅ Image analysis completed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Image analysis error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

/**
 * Extract images and text from a PDF file
 * @param {File|string} pdfInput - PDF File object (preferred) or server path
 * @returns {Promise<Object>} Extracted content (images, text, metadata)
 */
export async function processPDF(pdfInput) {
  try {
    if (!pdfInput) {
      throw new Error('PDF file/path is required');
    }

    let response;
    if (typeof pdfInput === 'string') {
      const pdfPath = pdfInput.trim();
      if (!pdfPath) {
        throw new Error('PDF path cannot be empty');
      }

      console.log('📄 Processing PDF path:', pdfPath);
      response = await apiClient.post('/image/pdf/', { pdf_path: pdfPath });
    } else {
      console.log('📄 Uploading PDF file:', pdfInput.name);
      const formData = new FormData();
      formData.append('file', pdfInput);

      response = await apiClient.post('/image/pdf/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    console.log('✅ PDF processed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ PDF processing error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

/**
 * Get all image processing logs and metadata
 * Useful for auditing and final presentation
 * @returns {Promise<Object>} Logs organized by operation type
 */
export async function getImageProcessingLogs() {
  try {
    console.log('📝 Retrieving image processing logs...');
    const response = await apiClient.get('/image/logs/');
    console.log('✅ Logs retrieved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to retrieve logs:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

/**
 * Get current rate limit status and estimated wait time
 * @returns {Promise<Object>} Rate limit information
 */
export async function checkRateLimitStatus() {
  try {
    console.log('⏱️ Checking rate limit status...');
    const response = await apiClient.get('/image/rate-limit/');
    console.log('✅ Rate limit status retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to check rate limit:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
}

/**
 * Get client-side rate limiter status
 * Useful for UI feedback without server call
 * @returns {Object} Local rate limit status
 */
export function getLocalRateLimitStatus() {
  return imageRateLimiter.getStatus();
}

/**
 * Convert file to Base64 string for image analysis
 * @param {File} file - Image file to convert
 * @returns {Promise<string>} Base64 encoded image
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Download generated image to client
 * @param {string} imageUrl - URL or data URI of the image
 * @param {string} filename - Filename for download
 */
export function downloadImage(imageUrl, filename = 'generated_image.png') {
  try {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('✅ Image downloaded:', filename);
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    throw error;
  }
}

export default {
  generateImage,
  analyzeImage,
  processPDF,
  getImageProcessingLogs,
  checkRateLimitStatus,
  getLocalRateLimitStatus,
  fileToBase64,
  downloadImage,
  imageRateLimiter
};

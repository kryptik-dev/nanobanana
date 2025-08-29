

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface OpenRouterImageRequest {
  prompt: string;
  model?: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  inputImage?: File | string; // For image-to-image editing
}

export interface OpenRouterImageResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  data?: any;
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel = 'google/gemini-2.5-flash-image-preview:free'; // Free tier with image support

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(request: OpenRouterImageRequest): Promise<OpenRouterImageResponse> {
    try {
      console.log('Generating image with OpenRouter:', {
        prompt: request.prompt,
        model: request.model || this.defaultModel,
        hasInputImage: !!request.inputImage
      });

      // Convert input image to base64 if it's a File
      let imageUrl = '';
      if (request.inputImage) {
        if (request.inputImage instanceof File) {
          imageUrl = await this.fileToBase64(request.inputImage);
        } else {
          imageUrl = request.inputImage;
        }
      }

      // Prepare messages for the chat completion
      const messages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: [
            {
              type: 'text',
              text: `You are an expert AI image editor and generator. When editing images:
- Always preserve the identity and appearance of people in the image
- Maintain facial features, pose, and body proportions exactly
- Only modify what is specifically requested
- Keep the same lighting, composition, and style
- Ensure high quality and realistic results`
            }
          ]
        }
      ];
      
      if (imageUrl) {
        // Image-to-image editing with preservation instructions
        const enhancedPrompt = `Edit this image: ${request.prompt}

IMPORTANT: 
- Keep the same person/face exactly as shown in the original image
- Maintain the same pose, facial features, and identity
- Only change what is specifically requested in the prompt
- Preserve the overall composition and style
- Keep the same lighting and atmosphere

Please apply the requested changes while maintaining the original person's appearance.`;
        
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: enhancedPrompt
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        });
      } else {
        // Text-to-image generation with quality instructions
        const enhancedPrompt = `Generate a high-quality image: ${request.prompt}

Requirements:
- Professional photography quality
- Sharp details and realistic textures
- Beautiful lighting and composition
- High resolution and clarity
- Artistic but realistic style`;
        
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: enhancedPrompt
            }
          ]
        });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NinjaJS Image Generator'
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          modalities: ["image", "text"] // This tells the model to generate images
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API error:', response.status, errorData);
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenRouter API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please check your prompt and parameters.');
        } else {
          throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      console.log('OpenRouter response:', data);

      // Extract image URL from the response
      if (data.choices && data.choices.length > 0) {
        const message = data.choices[0].message;
        const content = message.content;
        
        console.log('Full message structure:', message);
        console.log('Message content:', content);
        console.log('Message images:', message.images);
        
        // First, check if the message has an images array (OpenRouter format)
        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
          const imageUrl = message.images[0].image_url?.url;
          if (imageUrl) {
            console.log('Found image in OpenRouter response:', imageUrl);
            return {
              success: true,
              imageUrl: imageUrl,
              data: data
            };
          }
        }
        
        // Fallback: Look for image URLs in the content
        if (typeof content === 'string') {
          // Check if the response contains an image URL
          const imageUrlMatch = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
          if (imageUrlMatch) {
            console.log('Found image URL in text content:', imageUrlMatch[0]);
            return {
              success: true,
              imageUrl: imageUrlMatch[0],
              data: data
            };
          }
        } else if (Array.isArray(content)) {
          // Multi-modal response
          for (const item of content) {
            if (item.type === 'image_url' && item.image_url?.url) {
              console.log('Found image in multi-modal content:', item.image_url.url);
              return {
                success: true,
                imageUrl: item.image_url.url,
                data: data
              };
            }
          }
        }
        
        // If no image found, return the text response
        console.log('No image found in response, returning text content');
        return {
          success: true,
          imageUrl: '', // No image generated
          message: typeof content === 'string' ? content : 'Response received but no image generated',
          data: data
        };
      } else {
        throw new Error('No response generated');
      }

    } catch (error) {
      console.error('Error generating image with OpenRouter:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Convert File to base64 for API
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Analyze an image (what's in the image)
  async analyzeImage(imageFile: File, question?: string): Promise<string> {
    try {
      const imageUrl = await this.fileToBase64(imageFile);
      
      const messages: OpenRouterMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: question || 'What is in this image?'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NinjaJS Image Generator'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          modalities: ["text"] // For analysis, we only need text output
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response generated');
      }

    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  // Get available models (useful for debugging)
  async getModels(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NinjaJS Image Generator'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  // Check API key validity
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NinjaJS Image Generator'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }
}

// Free tier models available on OpenRouter with image support:
// - google/gemini-2.5-flash-image-preview:free (text + image input/output)
// - anthropic/claude-3.5-sonar:free (text + image input)
// - openai/gpt-4o-mini:free (text + image input)
// - meta-llama/llama-3.1-405b-instruct:free (text only)

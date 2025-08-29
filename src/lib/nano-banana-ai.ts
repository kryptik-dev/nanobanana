import { Client } from "@gradio/client";

export interface NanoBananaRequest {
  prompt: string;
  singleImage?: File | Blob | Buffer;
  multiImages?: Array<File | Blob | Buffer>;
}

export interface NanoBananaResponse {
  imageUrl: string;
  success: boolean;
  message?: string;
}

export class NanoBananaService {
  private client: Client | null = null;
  private isConnected = false;
  private workerUrl = 'https://nanobanana.amaandildar53.workers.dev';

  async connect() {
    // Always fetch a fresh token and reconnect to ensure authentication is current
    try {
      console.log("Connecting to aiqtech/Nano-Banana-API...");
      
      // Fetch fresh token from Cloudflare Worker
      console.log("Fetching fresh token from Worker...");
      const tokenResponse = await fetch(`${this.workerUrl}/token`);
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to fetch token from Worker: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      const hfToken = tokenData.token;
      
      if (!hfToken) {
        throw new Error("No token received from Worker");
      }
      
      console.log("HF Token fetched from Worker successfully");
      
      // Always create a new connection with fresh token
      this.client = await Client.connect("aiqtech/Nano-Banana-API", {
        hf_token: hfToken
      });
      
      this.isConnected = true;
      console.log("Successfully connected to Nano Banana API with fresh HF token");
      
      // Test the connection by checking login status first
      try {
        const loginStatusResult = await this.client.predict("_check_login_status", {});
        console.log("Login status check result:", loginStatusResult);
        
        if (loginStatusResult.data && typeof loginStatusResult.data === 'string') {
          if (loginStatusResult.data.includes("logged in") || loginStatusResult.data.includes("true")) {
            console.log("✅ Successfully authenticated with Hugging Face API");
          } else {
            console.warn("⚠️ Authentication status unclear:", loginStatusResult.data);
          }
        }
      } catch (loginError) {
        console.warn("Login status check failed:", loginError);
        // Don't throw here - the connection might still work for some endpoints
      }
    } catch (error) {
      console.error("Failed to connect to Nano Banana API:", error);
      
      // Check if it's a space metadata error
      if (error instanceof Error && error.message.includes("Space metadata could not be loaded")) {
        console.error("The Hugging Face Space appears to be private, down, or requires special access");
        console.error("Consider using an alternative image generation service");
      }
      
      this.isConnected = false;
      this.client = null;
      throw new Error("Failed to connect to Nano Banana API");
    }
  }

  async generateImage(request: NanoBananaRequest, retryCount = 0): Promise<NanoBananaResponse> {
    const maxRetries = 2; // 0, 1, 2 = 3 total attempts
    
    // Safety check: prevent retry count from exceeding maximum
    if (retryCount > maxRetries) {
      console.log(`Retry count ${retryCount} exceeds maximum ${maxRetries}. Stopping.`);
      return {
        imageUrl: "",
        success: false,
        message: `Maximum retries exceeded. Stopped at attempt ${retryCount + 1}.`,
      };
    }
    
    try {
      await this.connect();

      if (!this.client) {
        throw new Error("Client not connected");
      }

      // Verify login status before proceeding with image generation
      try {
        const loginCheck = await this.client.predict("_check_login_status", {});
        console.log("Pre-generation login check:", loginCheck);
        
        if (loginCheck.data && typeof loginCheck.data === 'string') {
          if (loginCheck.data.includes("not logged in") || loginCheck.data.includes("false")) {
            throw new Error("Not authenticated with Hugging Face API. Please check your token.");
          }
        }
      } catch (loginError) {
        console.error("Login verification failed:", loginError);
        throw new Error("Failed to verify authentication status");
      }

      // Prepare the multi_images array - send actual File objects as the API expects
      const multiImages = request.multiImages || [];

      // Call the unified_generator endpoint - simplified to match working Space format
      console.log("Sending request to /unified_generator:", {
        prompt: request.prompt,
        hasSingleImage: !!request.singleImage,
        singleImageType: request.singleImage?.constructor.name,
        multiImagesCount: multiImages.length,
        multiImagesTypes: multiImages.map(img => img?.constructor.name)
      });
      
      // For each prediction call, we need to ensure the token is still valid
      // The Gradio client should maintain the connection, but let's verify
      if (!this.client) {
        throw new Error("Client connection lost");
      }

      // Log the exact parameters being sent - using positional array format for Gradio client
      const predictionParams = [
        request.prompt,                    // prompt (position 0)
        request.singleImage || null,       // single_image (position 1)
        multiImages                        // multi_images (position 2)
      ];
      
      console.log("Sending prediction with positional params:", predictionParams);
      console.log("Client state:", {
        isConnected: this.isConnected,
        clientExists: !!this.client,
        clientType: this.client?.constructor.name
      });
      
      // Use the correct endpoint name from the API documentation
      // Gradio client expects positional arguments in an array, not named parameters
      const result = await this.client.predict("unified_generator", predictionParams);
      
      console.log("Received result:", result);
      console.log("Result data structure:", JSON.stringify(result.data, null, 2));
      
      // Check if the result contains an error (Gradio sometimes returns errors in the data)
      if (result.data && Array.isArray(result.data)) {
        const errorItem = result.data.find(item => 
          item && typeof item === 'object' && 
          (item.type === 'status' || item.success === false || item.message)
        );
        
        if (errorItem) {
          console.error("API returned error in response:", errorItem);
          if (errorItem.message && errorItem.message.includes('Login required')) {
            throw new Error("Login required. Authentication failed.");
          }
          if (errorItem.message) {
            throw new Error(errorItem.message);
          }
        }
      }
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Handle different response formats
        let imageUrl = "";
        
        // Log the first data item to see its structure
        console.log("First data item:", result.data[0]);
        console.log("First data item type:", typeof result.data[0]);
        console.log("First data item keys:", result.data[0] ? Object.keys(result.data[0]) : 'null');
        
        if (typeof result.data[0] === 'string') {
          // Direct URL string
          imageUrl = result.data[0];
          console.log("Extracted string URL:", imageUrl);
        } else if (result.data[0] && typeof result.data[0] === 'object') {
          // Object with image data
          const imageData = result.data[0];
          console.log("Image data object:", imageData);
          
          // Try different possible properties - prioritize URL over path
          if (imageData.url) {
            imageUrl = imageData.url;
            console.log("Found url:", imageUrl);
          } else if (imageData.path) {
            imageUrl = imageData.path;
            console.log("Found path:", imageUrl);
          } else if (imageData.data) {
            imageUrl = imageData.data;
            console.log("Found data:", imageUrl);
          } else if (imageData.name) {
            imageUrl = imageData.name;
            console.log("Found name:", imageUrl);
          } else if (imageData.src) {
            imageUrl = imageData.src;
            console.log("Found src:", imageUrl);
          }
          
          // If still no URL, try to find any property that looks like a URL
          if (!imageUrl) {
            for (const [key, value] of Object.entries(imageData)) {
              if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
                imageUrl = value;
                console.log(`Found URL in property ${key}:`, imageUrl);
                break;
              }
            }
          }
        }
        
        // Check if we got a JWT token URL (Hugging Face format)
        if (imageUrl && imageUrl.includes('huggingface.co/api/spaces') && imageUrl.includes('jwt')) {
          console.log("Detected JWT token URL, this is a Hugging Face Space response");
          
          // For JWT URLs, we need to fetch the actual image
          try {
            const jwtResponse = await fetch(imageUrl);
            if (jwtResponse.ok) {
              const jwtData = await jwtResponse.json();
              console.log("JWT response data:", jwtData);
              
              // Look for the actual image URL in the JWT response
              if (jwtData.url) {
                imageUrl = jwtData.url;
                console.log("Extracted image URL from JWT:", imageUrl);
              } else if (jwtData.path) {
                imageUrl = jwtData.path;
                console.log("Extracted image path from JWT:", imageUrl);
              } else if (jwtData.data) {
                imageUrl = jwtData.data;
                console.log("Extracted image data from JWT:", imageUrl);
              }
            }
          } catch (jwtError) {
            console.error("Error fetching JWT data:", jwtError);
          }
        }
        
        if (imageUrl) {
          console.log("Final extracted image URL:", imageUrl);
          return {
            imageUrl: imageUrl,
            success: true,
          };
        } else {
          console.error("Could not extract image URL from response:", result.data[0]);
          console.error("Full response data:", result.data);
          throw new Error("Image data format not recognized");
        }
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error(`Error generating image (attempt ${retryCount + 1}):`, error);
      
      // Check if we should retry - force stop at exactly 3 attempts
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/3)`);
        
        // Add user-friendly retry message
        if (retryCount === 0) {
          console.log("First retry attempt...");
        } else if (retryCount === 1) {
          console.log("Second retry attempt...");
        } else {
          console.log("Final retry attempt...");
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateImage(request, retryCount + 1);
      } else {
        // Force stop - we've reached the maximum retries
        console.log(`Maximum retries (3) reached. Stopping retry loop.`);
      }
      
      // Handle specific error types for better user feedback
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = error.message as string;
        
        // Check for Hugging Face authentication errors
        if (errorMessage.includes('Login required') || errorMessage.includes('not logged in')) {
          return {
            imageUrl: "",
            success: false,
            message: "Authentication failed. Please check your Hugging Face token and try again.",
          };
        }
        
        if (errorMessage.includes('502') || errorMessage.includes('ReplicateError') || errorMessage.includes('Server')) {
          return {
            imageUrl: "",
            success: false,
            message: "Server temporarily unavailable after multiple attempts. Please try again later.",
          };
        }
        
        if (errorMessage.includes('timeout') || errorMessage.includes('duration')) {
          return {
            imageUrl: "",
            success: false,
            message: "Request timed out after multiple attempts. The server may be busy.",
          };
        }
        
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          return {
            imageUrl: "",
            success: false,
            message: "Rate limit exceeded after multiple attempts. Please wait a moment and try again.",
          };
        }
      }
      
      return {
        imageUrl: "",
        success: false,
        message: `Failed after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      };
    }
  }

  async processImage(img: File | Blob | Buffer): Promise<string> {
    try {
      await this.connect();

      if (!this.client) {
        throw new Error("Client not connected");
      }

      // Call the lambda_2 endpoint for image processing
      const result = await this.client.predict("/lambda_2", {
        img: img,
      });

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        return result.data[0];
      } else {
        throw new Error("No processed image returned");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Helper method to create a request with images
  createRequest(
    prompt: string,
    singleImage?: File | Blob | Buffer,
    multiImages?: Array<File | Blob | Buffer>
  ): NanoBananaRequest {
    return {
      prompt,
      singleImage,
      multiImages,
    };
  }

  // Helper method to validate image files
  validateImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 20 * 1024 * 1024; // 20MB limit
    
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid image type: ${file.type}. Supported types: ${validTypes.join(', ')}`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`Image too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 20MB`);
    }
    
    return true;
  }

  // Helper method to convert File to Blob if needed
  async fileToBlob(file: File): Promise<Blob> {
    return file;
  }

  // Helper method to save image response to a file (browser environment)
  saveImageToFile(fileName: string, imageUrl: string): void {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Check API status
  async checkAPIStatus(): Promise<{ isAvailable: boolean; message: string }> {
    try {
      await this.connect();
      
      if (!this.client) {
        return { isAvailable: false, message: "Client not connected" };
      }

      // Try a simple endpoint to check status
      const result = await this.client.predict("/control_access", {});
      
      return { 
        isAvailable: true, 
        message: "API is available and responding" 
      };
    } catch (error) {
      return { 
        isAvailable: false, 
        message: `API check failed: ${error instanceof Error ? error.message : "Unknown error"}` 
      };
    }
  }

  // Get alternative endpoints info
  getAlternativeEndpoints(): Array<{ name: string; description: string; endpoint: string }> {
    return [
      {
        name: "unified_generator",
        description: "Main image generation with prompt and images",
        endpoint: "/unified_generator"
      },
      {
        name: "lambda_2",
        description: "Simple image processing",
        endpoint: "/lambda_2"
      },
      {
        name: "control_access",
        description: "API status check",
        endpoint: "/control_access"
      }
    ];
  }

  // Test API with simple request
  async testAPI(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      await this.connect();
      
      if (!this.client) {
        return { success: false, message: "Client not connected" };
      }

      // Test with control_access endpoint
      const result = await this.client.predict("/control_access", {});
      console.log("Test API result:", result);
      
      return { 
        success: true, 
        message: "API test successful",
        details: result
      };
    } catch (error) {
      console.error("API test failed:", error);
      return { 
        success: false, 
        message: `API test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error
      };
    }
  }
}

// Export a default instance
export const nanoBananaAI = new NanoBananaService();

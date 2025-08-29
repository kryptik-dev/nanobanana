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

  async connect() {
    if (!this.isConnected) {
      try {
        this.client = await Client.connect("aiqtech/Nano-Banana-API");
        this.isConnected = true;
        console.log("Connected to Nano Banana API");
      } catch (error) {
        console.error("Failed to connect to Nano Banana API:", error);
        throw new Error("Failed to connect to Nano Banana API");
      }
    }
  }

  async generateImage(request: NanoBananaRequest): Promise<NanoBananaResponse> {
    try {
      await this.connect();

      if (!this.client) {
        throw new Error("Client not connected");
      }

      // Prepare the multi_images array
      const multiImages = request.multiImages?.map(img => ({
        image: {
          path: img instanceof File ? URL.createObjectURL(img) : "",
          meta: { _type: "gradio.FileData" },
          orig_name: img instanceof File ? img.name : "image",
          url: img instanceof File ? URL.createObjectURL(img) : ""
        }
      })) || [];

      // Call the unified_generator endpoint
      const result = await this.client.predict("/unified_generator", {
        prompt: request.prompt,
        single_image: request.singleImage || null,
        multi_images: multiImages,
      });

      if (result.data && result.data.length > 0) {
        return {
          imageUrl: result.data[0],
          success: true,
        };
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      return {
        imageUrl: "",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
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

      if (result.data && result.data.length > 0) {
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
}

// Export a default instance
export const nanoBananaAI = new NanoBananaService();

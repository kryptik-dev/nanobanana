// Local image storage with automatic 24-hour expiration
export interface StoredImage {
  id: string;
  url: string;
  type: 'input' | 'output';
  alt?: string;
  timestamp: number;
  expiresAt: number;
}

class ImageStorage {
  private readonly STORAGE_KEY = 'ninja_js_images';
  private readonly EXPIRY_HOURS = 24;
  private readonly EXPIRY_MS = this.EXPIRY_HOURS * 60 * 60 * 1000;

  constructor() {
    // Clean up expired images on initialization
    this.cleanupExpiredImages();
  }

  // Store an image locally with 24-hour expiration
  async storeImage(file: File, type: 'input' | 'output', alt?: string): Promise<StoredImage> {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const expiresAt = timestamp + this.EXPIRY_MS;

    // Convert file to base64 for local storage
    const base64 = await this.fileToBase64(file);
    
    const storedImage: StoredImage = {
      id,
      url: base64,
      type,
      alt,
      timestamp,
      expiresAt
    };

    // Save to localStorage
    this.saveToStorage(storedImage);
    
    console.log(`Image stored locally with ID: ${id}, expires at: ${new Date(expiresAt).toLocaleString()}`);
    
    return storedImage;
  }

  // Store multiple images
  async storeImages(files: File[], type: 'input' | 'output', altPrefix?: string): Promise<StoredImage[]> {
    const storedImages: StoredImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const alt = altPrefix ? `${altPrefix} ${i + 1}` : undefined;
      const storedImage = await this.storeImage(files[i], type, alt);
      storedImages.push(storedImage);
    }
    
    return storedImages;
  }

  // Get all stored images
  getStoredImages(): StoredImage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const images: StoredImage[] = JSON.parse(stored);
      return images.filter(img => img.expiresAt > Date.now());
    } catch (error) {
      console.error('Error reading stored images:', error);
      return [];
    }
  }

  // Get image by ID
  getImageById(id: string): StoredImage | null {
    const images = this.getStoredImages();
    return images.find(img => img.id === id) || null;
  }

  // Remove image by ID
  removeImage(id: string): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const images: StoredImage[] = JSON.parse(stored);
      const filteredImages = images.filter(img => img.id !== id);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredImages));
      console.log(`Image ${id} removed from local storage`);
      return true;
    } catch (error) {
      console.error('Error removing image:', error);
      return false;
    }
  }

  // Clean up expired images
  cleanupExpiredImages(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
      const images: StoredImage[] = JSON.parse(stored);
      const currentTime = Date.now();
      const validImages = images.filter(img => img.expiresAt > currentTime);
      
      if (validImages.length !== images.length) {
        const expiredCount = images.length - validImages.length;
        console.log(`Cleaned up ${expiredCount} expired images`);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validImages));
      }
    } catch (error) {
      console.error('Error cleaning up expired images:', error);
    }
  }

  // Clear all stored images
  clearAllImages(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('All stored images cleared');
    } catch (error) {
      console.error('Error clearing all images:', error);
    }
  }

  // Get storage usage info
  getStorageInfo(): { totalImages: number; totalSize: number; oldestImage: Date | null } {
    const images = this.getStoredImages();
    const totalImages = images.length;
    
    // Estimate total size (base64 is roughly 33% larger than original)
    const totalSize = images.reduce((sum, img) => {
      // Rough estimate: base64 string length * 0.75 bytes
      return sum + (img.url.length * 0.75);
    }, 0);
    
    const oldestImage = images.length > 0 
      ? new Date(Math.min(...images.map(img => img.timestamp)))
      : null;
    
    return {
      totalImages,
      totalSize: Math.round(totalSize / 1024), // KB
      oldestImage
    };
  }

  // Convert File to base64
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
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  // Save image to localStorage
  private saveToStorage(image: StoredImage): void {
    try {
      const existing = this.getStoredImages();
      existing.push(image);
      
      // Check storage limit (localStorage has ~5-10MB limit)
      let totalSize = existing.reduce((sum, img) => sum + img.url.length, 0);
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (totalSize > maxSize) {
        // Remove oldest images until under limit
        existing.sort((a, b) => a.timestamp - b.timestamp);
        while (existing.length > 0 && totalSize > maxSize) {
          const removed = existing.shift();
          if (removed) {
            totalSize -= removed.url.length;
            console.log(`Removed oldest image ${removed.id} due to storage limit`);
          }
        }
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving image to storage:', error);
      
      // If localStorage fails, try to free up space
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded, cleaning up old images...');
        this.cleanupExpiredImages();
        
        // Try again with reduced set
        const existing = this.getStoredImages();
        existing.push(image);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
      }
    }
  }

  // Set up automatic cleanup every hour
  setupAutoCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredImages();
    }, 60 * 60 * 1000); // Every hour
  }
}

// Create singleton instance
export const imageStorage = new ImageStorage();

// Set up automatic cleanup
imageStorage.setupAutoCleanup();

export default imageStorage;

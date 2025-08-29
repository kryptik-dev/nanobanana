import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Bot, Sparkles, Mic, Paperclip, Image, Upload, Download, X, Zap, Settings, Edit3, Check, ChevronDown, ChevronRight, Trash2, Eye } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { Message } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OpenRouterService } from '@/lib/openrouter-ai';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInterfaceProps {
  messages: Message[];
  isProcessing: boolean;
  sendMessage: (content: string) => void;
  addMessageWithImages: (content: string, images: Array<{ url: string; type: 'input' | 'output'; alt?: string }>) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  streamingContent: string;
  isPuterLoaded: boolean;
  userProfilePicture?: string;
  aiProfilePicture?: string;
  isCreateMode: boolean;
  setIsCreateMode: (mode: boolean) => void;
}

const ChatInterface = ({
  messages,
  isProcessing,
  sendMessage,
  addMessageWithImages,
  setMessages,
  streamingContent,
  isPuterLoaded,
  userProfilePicture,
  aiProfilePicture,
  isCreateMode,
  setIsCreateMode
}: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [lastGeneratedImage, setLastGeneratedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isImagePanelOpen, setIsImagePanelOpen] = useState(false); // For mobile image panel toggle
  
  // Persistent reference images that AI can always access
  const [persistentReferenceImages, setPersistentReferenceImages] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize OpenRouter service
  const openRouterAI = new OpenRouterService(import.meta.env.VITE_OPENROUTER_API_KEY || '');
  
  // Check if API key is configured
  const isApiKeyConfigured = !!import.meta.env.VITE_OPENROUTER_API_KEY;
  
  // Helper function to get all available reference images (UI + persistent)
  const getAllReferenceImages = () => {
    const allImages = [...referenceImages, ...persistentReferenceImages];
    // Remove duplicates based on file name and size
    const uniqueImages = allImages.filter((image, index, self) => 
      index === self.findIndex(img => 
        img.name === image.name && img.size === image.size
      )
    );
    return uniqueImages;
  };

  // Helper function to get the main reference image for AI editing
  const getMainReferenceImage = () => {
    // Priority: selectedImage > first persistent reference > first UI reference
    if (selectedImage) return selectedImage;
    if (persistentReferenceImages.length > 0) return persistentReferenceImages[0];
    if (referenceImages.length > 0) return referenceImages[0];
    return null;
  };

  const handleSend = async () => {
    if ((input.trim() || selectedImage) && !isProcessing && !isProcessingImage) {
      // If we're editing a message, handle it differently
      if (editingMessageId) {
        await handleSaveEdit();
        return;
      }
      try {
        if (isCreateMode) {
          // CREATE MODE: Generate image from text description
          if (!isApiKeyConfigured) {
            addMessageWithImages(`⚠️ **OpenRouter API Key not configured!** 

To generate images, you need to:
1. Go to [https://openrouter.ai/](https://openrouter.ai/) and sign up
2. Get your free API key (includes free credits)
3. Create a \`.env\` file with: \`VITE_OPENROUTER_API_KEY=your_key_here\`
4. Restart the app`, []);
            return;
          }
          
          if (!input.trim()) {
            addMessageWithImages(`⚠️ **Text description needed for creation!** 

Please describe what you want to create. For example:
• "A beautiful sunset over mountains"
• "A futuristic city skyline at night"
• "A cute cartoon cat playing with yarn"`, []);
            return;
          }
          
          // Create user message for text-to-image generation
          const userMessage: Message = {
            id: crypto.randomUUID(),
            content: input.trim(),
            role: 'user',
            createdAt: new Date(),
            images: [], // No images in create mode
          };
          
          // Add user message to chat
          setMessages((prev) => [...prev, userMessage]);
          
          // Clear input and start processing
          setInput('');
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
          
          // Process text-to-image generation
          setIsProcessingImage(true);
          setRetryAttempt(0);
          
          let retryCount = 0;
          const maxRetries = 2; // 0, 1, 2 = 3 total attempts
          
          let response;
          let lastError = '';
          
          // Retry loop for text-to-image generation - force stop at exactly 3 attempts
          while (retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                setRetryAttempt(retryCount);
                sendMessage(`Retry attempt ${retryCount}/3...`);
              }
              
              // Get the main reference image for AI generation
              const mainReferenceImage = getMainReferenceImage();
              
              response = await openRouterAI.generateImage({
                prompt: input.trim(),
                model: 'google/gemini-2.5-flash-image-preview:free',
                inputImage: mainReferenceImage // Use main reference image if available
              });
              
              if (response.success) {
                break;
              } else {
                lastError = response.message;
                if (retryCount < maxRetries) {
                  retryCount++;
                  continue;
                } else {
                  // Force stop at max retries reached
                  break;
                }
              }
            } catch (error) {
              lastError = error instanceof Error ? error.message : 'Unknown error';
              if (retryCount < maxRetries) {
                retryCount++;
                continue;
              } else {
                // Force stop at max retries reached
                break;
              }
            }
          }
          
          // Handle final result for text-to-image
          if (response && response.success) {
            const retryMessage = retryCount > 0 ? ` (Generated after ${retryCount} retry${retryCount > 1 ? 's' : ''})` : '';
            
            // Store the generated image for future editing
            setLastGeneratedImage({
              url: response.imageUrl,
              alt: 'Generated image'
            });
            
            addMessageWithImages(
              '',
              [{
                url: response.imageUrl,
                type: 'output',
                alt: 'Generated image'
              }]
            );
            
            if (retryCount > 0) {
              sendMessage(`✅ Successfully created your image after ${retryCount} retry${retryCount > 1 ? 's' : ''}!`);
            }
            
            // Don't clear lastGeneratedImage - keep it for editing
            setSelectedImage(null);
            setReferenceImages([]);
            setIsImagePanelOpen(false); // Close panel on mobile after sending
          } else {
            const errorMessage = lastError || (response?.message || 'Unknown error');
            sendMessage(`❌ Image creation failed after 3 attempts: ${errorMessage}`);
            
            if (errorMessage.includes('Server temporarily unavailable') || 
                errorMessage.includes('Request timed out')) {
              sendMessage(`💡 Tip: This is a temporary server issue. You can try again in a few minutes.`);
            } else if (errorMessage.includes('Rate limit')) {
              sendMessage(`💡 Tip: Too many requests. Please wait a moment before trying again.`);
            } else {
              sendMessage(`💡 Tip: You can try again with a different description.`);
            }
            
            sendMessage(`🔄 You can also try sending the same request again - we'll automatically retry up to 3 times.`);
            
            // Don't clear lastGeneratedImage on failure - keep it for retry
            setSelectedImage(null);
            setReferenceImages([]);
            setIsImagePanelOpen(false); // Close panel on mobile after sending
          }
          
        } else if (selectedImage || (lastGeneratedImage && input.trim())) {
          // EDIT MODE: Edit existing image OR edit last generated image
          
          if (!isApiKeyConfigured) {
            addMessageWithImages(`⚠️ **OpenRouter API Key not configured!** 

To edit images, you need to:
1. Go to [https://openrouter.ai/](https://openrouter.ai/) and sign up
2. Get your free API key (includes free credits)
3. Create a \`.env\` file with: \`VITE_OPENROUTER_API_KEY=your_key_here\`
4. Restart the app`, []);
            return;
          }
          
          // FIRST: Add user message with images immediately (like ChatGPT)
          const userImages: Array<{ url: string; type: 'input' | 'output'; alt?: string }> = [];
          
          try {
            // Use image directly - no localStorage storage
            if (selectedImage) {
              const imageUrl = URL.createObjectURL(selectedImage);
              console.log('Main image ready for AI:', selectedImage.name);
              userImages.push({
                url: imageUrl,
                type: 'input',
                alt: selectedImage.name
              });
            } else if (lastGeneratedImage) {
              // Use the last generated image as the main image for editing
              console.log('Using last generated image for editing:', lastGeneratedImage.alt);
              
              // Download the generated image and convert it to a File object
              try {
                const response = await fetch(lastGeneratedImage.url);
                if (!response.ok) {
                  throw new Error(`Failed to fetch image: ${response.status}`);
                }
                
                const blob = await response.blob();
                const file = new File([blob], lastGeneratedImage.alt, { type: blob.type });
                
                // Use image directly - no localStorage storage
                const imageUrl = URL.createObjectURL(file);
                console.log('Downloaded last generated image ready for AI:', lastGeneratedImage.alt);
                
                // Add to user images for display
                userImages.push({
                  url: imageUrl,
                  type: 'input',
                  alt: lastGeneratedImage.alt
                });
                
                // Don't set as selected image - keep it separate for AI processing
                // setSelectedImage(file);
                
              } catch (error) {
                console.error('Failed to download last generated image:', error);
                // Fallback: just show the image but don't use it for editing
                userImages.push({
                  url: lastGeneratedImage.url,
                  type: 'input',
                  alt: lastGeneratedImage.alt
                });
              }
            }
            
            // Use reference images directly - no localStorage storage
            for (let i = 0; i < referenceImages.length; i++) {
              const img = referenceImages[i];
              const imageUrl = URL.createObjectURL(img);
              console.log(`Reference image ${i + 1} ready for AI:`, img.name);
              userImages.push({
                url: imageUrl,
                type: 'input',
                alt: `Reference ${i + 1}`
              });
            }
          } catch (error) {
            console.error('Error storing images locally:', error);
            // Fallback to blob URLs if local storage fails
            if (selectedImage) {
              const mainImageUrl = URL.createObjectURL(selectedImage);
              userImages.push({
                url: mainImageUrl,
                type: 'input',
                alt: selectedImage.name
              });
            }
            
            referenceImages.forEach((img, index) => {
              const refImageUrl = URL.createObjectURL(img);
              userImages.push({
                url: refImageUrl,
                type: 'input',
                alt: `Reference ${index + 1}`
              });
            });
          }
          
          console.log('Final userImages array:', userImages);
          
          // Capture the input content before clearing it
          const userPrompt = input.trim() || "Please edit this image";
          
          // Create user message with images manually
          const userMessage: Message = {
            id: crypto.randomUUID(),
            content: userPrompt,
            role: 'user',
            createdAt: new Date(),
            images: userImages,
          };
          
          console.log('Creating user message with images:', userMessage);
          console.log('User images array:', userImages);
          
          // Add user message to chat
          setMessages((prev) => [...prev, userMessage]);
          
          // Clear input and start processing
          setInput('');
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
          
          // NOW: Process with AI
          setIsProcessingImage(true);
          setRetryAttempt(0); // Reset retry count
          
          // Add retry attempt indicator
          let retryCount = 0;
          const maxRetries = 2; // 0, 1, 2 = 3 total attempts
          
          let response;
          let lastError = '';
          
          // Retry loop with user feedback - force stop at exactly 3 attempts
          while (retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                // Update retry attempt state for UI
                setRetryAttempt(retryCount);
                // Show retry attempt message
                sendMessage(`🔄 Retry attempt ${retryCount}/3...`);
              }
              
              // For image editing, prioritize lastGeneratedImage over original reference
              let inputImage: File | undefined;
              if (lastGeneratedImage) {
                // Convert last generated image URL back to File for editing
                try {
                  const response = await fetch(lastGeneratedImage.url);
                  const blob = await response.blob();
                  inputImage = new File([blob], lastGeneratedImage.alt, { type: blob.type });
                  console.log('Using lastGeneratedImage for editing:', lastGeneratedImage.alt);
                } catch (error) {
                  console.error('Failed to convert last generated image to file:', error);
                }
              } else if (selectedImage) {
                // Fallback to selected image if no lastGeneratedImage
                inputImage = selectedImage;
                console.log('Using selectedImage for editing:', selectedImage.name);
              }
              
              // Only use mainReferenceImage if no other image is available
              if (!inputImage) {
                const mainReferenceImage = getMainReferenceImage();
                if (mainReferenceImage) {
                  inputImage = mainReferenceImage;
                  console.log('Using mainReferenceImage for editing:', mainReferenceImage.name);
                }
              }
              
              response = await openRouterAI.generateImage({
                prompt: input.trim() || "Please edit this image",
                model: 'google/gemini-2.5-flash-image-preview:free',
                inputImage: inputImage
              });
              
              if (response.success) {
                break; // Success, exit retry loop
              } else {
                lastError = response.message;
                if (retryCount < maxRetries) {
                  retryCount++;
                  continue; // Try again
                } else {
                  // Force stop at max retries reached
                  break;
                }
              }
            } catch (error) {
              lastError = error instanceof Error ? error.message : 'Unknown error';
              if (retryCount < maxRetries) {
                retryCount++;
                continue; // Try again
              } else {
                // Force stop at max retries reached
                break;
              }
            }
          }
          
          // Handle final result
          if (response && response.success) {
            // Add AI response message with generated image
            const retryMessage = retryCount > 0 ? ` (Generated after ${retryCount} retry${retryCount > 1 ? 's' : ''})` : '';
            
            // Store the generated image for future editing
            setLastGeneratedImage({
              url: response.imageUrl,
              alt: 'Generated image'
            });
            
            addMessageWithImages(
              '',
              [{
                url: response.imageUrl,
                type: 'output',
                alt: 'Generated image'
              }]
            );
            
            // Show success message with retry info if applicable
            if (retryCount > 0) {
              sendMessage(`✅ Successfully generated your image after ${retryCount} retry${retryCount > 1 ? 's' : ''}!`);
            }
            
            // Don't clear lastGeneratedImage - keep it for editing
            setSelectedImage(null);
            setReferenceImages([]);
            setIsImagePanelOpen(false); // Close panel on mobile after sending
          } else {
            const errorMessage = lastError || (response?.message || 'Unknown error');
            sendMessage(`❌ Image processing failed after 3 attempts: ${errorMessage}`);
            
            // Provide helpful suggestions based on error type
            if (errorMessage.includes('Server temporarily unavailable') || 
                errorMessage.includes('Request timed out')) {
              sendMessage(`💡 Tip: This is a temporary server issue. You can try again in a few minutes.`);
            } else if (errorMessage.includes('Rate limit')) {
              sendMessage(`💡 Tip: Too many requests. Please wait a moment before trying again.`);
            } else {
              sendMessage(`💡 Tip: You can try again with a different prompt or image.`);
            }
            
            // Add manual retry suggestion
            sendMessage(`🔄 You can also try sending the same request again - we'll automatically retry up to 3 times.`);
            
            // Don't clear lastGeneratedImage on failure - keep it for retry
            setSelectedImage(null);
            setReferenceImages([]);
            setIsImagePanelOpen(false); // Close panel on mobile after sending
          }
          
          // Images are now cleared immediately after creating user message
        } else {
          // No image provided in edit mode - show AI notification
          addMessageWithImages(`⚠️ **Image needed to edit!** 

Please upload an image first, then describe what you want to edit. 

You can:
• Upload a main image to edit
• Add reference images for style guidance
• Describe your desired changes in the text area

💡 **Tip**: Switch to "Create Mode" if you want to generate images from text descriptions!`, []);
          
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
          }
        }
      } catch (error) {
        console.error('Error processing image:', error);
        sendMessage(`Error: ${error instanceof Error ? error.message : 'Failed to process image'}`);
      } finally {
        setIsProcessingImage(false);
        setRetryAttempt(0); // Reset retry count
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      // Validate all files first
      const validFiles: File[] = [];
      files.forEach(file => {
        try {
          // Basic file validation for OpenRouter (just check if it's an image)
          if (!file.type.startsWith('image/')) {
            throw new Error(`File must be an image: ${file.name}`);
          }
          validFiles.push(file);
        } catch (error) {
          alert(error instanceof Error ? error.message : `Invalid file: ${file.name}`);
        }
      });

      if (validFiles.length === 0) return;

      // If only one image, set as main image
      if (validFiles.length === 1) {
        setSelectedImage(validFiles[0]);
        setReferenceImages([]); // Clear reference images
        // Add to persistent references for AI
        setPersistentReferenceImages(prev => [...prev, validFiles[0]]);
        setIsImagePanelOpen(true); // Auto-open panel on mobile when image is added
      } else {
        // If multiple images, set first as main and rest as references
        setSelectedImage(validFiles[0]);
        setReferenceImages(validFiles.slice(1));
        // Add all images to persistent references for AI
        setPersistentReferenceImages(prev => [...prev, ...validFiles]);
        setIsImagePanelOpen(true); // Auto-open panel on mobile when image is added
        console.log(`Uploaded ${validFiles.length} images: 1 main + ${validFiles.length - 1} references`);
      }
    } catch (error) {
      alert('Error processing images');
    }
  };

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    files.forEach(file => {
      try {
        // Basic file validation for OpenRouter (just check if it's an image)
        if (!file.type.startsWith('image/')) {
          throw new Error(`File must be an image: ${file.name}`);
        }
        validFiles.push(file);
      } catch (error) {
        alert(error instanceof Error ? error.message : `Invalid file: ${file.name}`);
      }
    });
    
    setReferenceImages(prev => [...prev, ...validFiles]);
    // Also add to persistent references for AI
    setPersistentReferenceImages(prev => [...prev, ...validFiles]);
  };

  // Analyze an image using OpenRouter
  const handleAnalyzeImage = async (imageFile?: File) => {
    // If no image provided, use the main reference image
    const imageToAnalyze = imageFile || getMainReferenceImage();
    if (!imageToAnalyze) {
      addMessageWithImages(`⚠️ **No image to analyze!** 

Please upload an image first, then click the Analyze button.`, []);
      return;
    }
    if (!isApiKeyConfigured) {
      addMessageWithImages(`⚠️ **OpenRouter API Key not configured!** 

To analyze images, you need to:
1. Go to [https://openrouter.ai/](https://openrouter.ai/) and sign up
2. Get your free API key (includes free credits)
3. Create a \`.env\` file with: \`VITE_OPENROUTER_API_KEY=your_key_here\`
4. Restart the app`, []);
      return;
    }

    try {
      setIsProcessingImage(true);
      
      // Add user message with image
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: `Analyze this image: ${imageToAnalyze.name}`,
        role: 'user',
        createdAt: new Date(),
        images: [{
          url: URL.createObjectURL(imageToAnalyze),
          type: 'input',
          alt: imageToAnalyze.name
        }]
      };
      
      setMessages((prev) => [...prev, userMessage]);
      
      // Analyze the image with detailed prompt
      const analysis = await openRouterAI.analyzeImage(imageToAnalyze, `Analyze this image in detail:

Please describe:
- What you see in the image
- The main subject(s) and their appearance
- The setting, background, and environment
- Lighting, colors, and mood
- Any text, objects, or notable details
- The overall style and quality of the image

Be specific and descriptive, as this analysis will be used for image editing.`);
      
      // Add AI response
      addMessageWithImages(analysis, []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessageWithImages(`❌ Image analysis failed: ${errorMessage}`, []);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImage(null);
    setReferenceImages([]); // Clear UI references but keep persistent ones
    setLastGeneratedImage(null); // Clear last generated image when clearing all
    // Note: persistentReferenceImages are NOT cleared - AI can still use them
  };

  // Clear persistent references completely (use with caution)
  const clearPersistentReferences = () => {
    setPersistentReferenceImages([]);
    console.log('Persistent reference images cleared');
  };

  const getStorageInfo = () => {
    // No localStorage storage - return simple info
    return {
      totalImages: selectedImage ? 1 : 0 + referenceImages.length + persistentReferenceImages.length,
      totalSize: 0,
      oldestImage: null
    };
  };

  const cleanupExpiredImages = () => {
    // No localStorage cleanup needed
    console.log('No localStorage cleanup needed');
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setInput(content);
    
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
    setInput('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !input.trim()) return;

    try {
      // Update the message content
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId 
          ? { ...msg, content: input.trim() }
          : msg
      ));

      // Remove all AI responses that came after this message
      const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex !== -1) {
        setMessages(prev => prev.slice(0, messageIndex + 1));
      }

      // Clear edit state
      setEditingMessageId(null);
      setEditingContent('');
      setInput('');

      // Send the edited message to regenerate AI response
      if (isCreateMode || selectedImage) {
        // For image processing, we need to handle this differently
        // since we need to reprocess with the new prompt
        await handleSend();
      } else {
        // For text-only messages, send directly
        sendMessage(input.trim());
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };



  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Refresh storage info when images change
  useEffect(() => {
    // Force re-render to update storage info display
    const timer = setTimeout(() => {
      setSelectedImage(prev => prev);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedImage, referenceImages]);



  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Welcome message if no messages */}
      {messages.length === 0 && (
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-20 flex items-center justify-center relative z-10">
          <div className="max-w-3xl w-full text-center space-y-6 sm:space-y-8 md:space-y-10 px-4">
            {/* Hero Section */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500">

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white animate-in slide-in-from-bottom-4 duration-700">
                Welcome to Nano Banana
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-700 delay-200 leading-relaxed px-2">
                Better than Hollywood...
              </p>
            </div>

            {/* Loading State */}
            {!isPuterLoaded && (
              <Card className="max-w-md mx-auto animate-in fade-in duration-500 delay-300 border-white/20 bg-white/10 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6 md:p-8">
                  <Alert className="border-white/20 bg-white/20 text-white backdrop-blur-sm">
                    <Sparkles className="h-5 w-5 flex-shrink-0" />
                    <AlertDescription className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading Nano Banana AI... 🧠
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto pt-4 sm:pt-6 md:pt-8 animate-in fade-in duration-500 delay-500">
              <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="p-2 sm:p-3 md:p-4 bg-white/20 rounded-xl sm:rounded-2xl shadow-lg">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-white">Lightning Fast</span>
                  <p className="text-xs md:text-sm text-white/70 mt-1">Instant AI processing</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="p-2 sm:p-3 md:p-4 bg-white/20 rounded-xl sm:rounded-2xl shadow-lg">
                  <Image className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-white">Create & Edit</span>
                  <p className="text-xs md:text-sm text-white/70 mt-1">Generate new or transform existing</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="p-2 sm:p-3 md:p-4 bg-white/20 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-white">Always Ready</span>
                  <p className="text-xs md:text-sm text-white/70 mt-1">24/7 image editing</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Messages container */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-auto py-4 sm:py-6 px-4 sm:px-6 md:px-8 relative z-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full">
            {messages.map((message, index) => (
              <div 
                key={message.id} 
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <MessageBubble 
                  message={message} 
                  userProfilePicture={userProfilePicture}
                  aiProfilePicture={aiProfilePicture}
                  onEditMessage={handleEditMessage}
                />
              </div>
            ))}
            
            {/* Show streaming content */}
            {streamingContent && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <MessageBubble
                  message={{
                    id: 'streaming',
                    content: streamingContent,
                    role: 'assistant',
                    createdAt: new Date(),
                  }}
                  userProfilePicture={userProfilePicture}
                  aiProfilePicture={aiProfilePicture}
                  onEditMessage={handleEditMessage}
                />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Image Preview Section */}
      {(selectedImage || referenceImages.length > 0) && (
        <div className="border-t border-white/10 bg-black/80 backdrop-blur-md relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Mobile Collapsible Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-white/80">Images to Process</h3>
              
                          {/* Mobile Toggle Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImagePanelOpen(!isImagePanelOpen)}
                className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
                title="Toggle image panel"
              >
                {isImagePanelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              
              {/* Mobile Image Count Indicator */}
              <div className="lg:hidden text-xs text-white/50 flex items-center gap-1">
                {selectedImage && <span className="mr-2 flex items-center gap-1"><Image className="h-3 w-3" /> 1</span>}
                {referenceImages.length > 0 && <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {referenceImages.length}</span>}
                {/* Show persistent reference count even when UI is cleared */}
                {persistentReferenceImages.length > 0 && referenceImages.length === 0 && (
                  <span className="flex items-center gap-1 text-white/40">
                    <Eye className="h-3 w-3" /> {persistentReferenceImages.length} (persistent)
                  </span>
                )}
              </div>
                
                {/* Desktop Storage Info */}
                <div className="hidden lg:block text-xs text-white/50">
                  Storage: {getStorageInfo().totalImages} images ({getStorageInfo().totalSize} KB)
                  {getStorageInfo().oldestImage && (
                    <span className="ml-2">
                      • Oldest: {getStorageInfo().oldestImage?.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cleanupExpiredImages}
                  className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
                  title="Clean up expired images"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllImages}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  Clear All
                </Button>
                
                {/* Clear Persistent References Button - only show when persistent refs exist */}
                {persistentReferenceImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearPersistentReferences}
                    className="text-white/40 hover:text-white hover:bg-white/10 text-xs"
                    title="Clear all persistent reference images (AI will lose access to them)"
                  >
                    Clear Persistent
                  </Button>
                )}
              </div>
            </div>
            
            {/* Collapsible Content - Hidden on mobile by default */}
            <div className={`${isImagePanelOpen ? 'block' : 'hidden'} lg:block p-4 transition-all duration-200 ease-in-out`}>
            
            {/* Main Image */}
            {selectedImage && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/60">Main Image:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedImage}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedImage ? URL.createObjectURL(selectedImage) : ''}
                    alt="Selected"
                    className="h-16 w-16 object-cover rounded-lg border border-white/20"
                  />
                  <div className="text-xs text-white/60">
                    <div>{selectedImage.name}</div>
                    <div>{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyzeImage()}
                      className="h-6 px-2 mt-1 text-xs border-white/20 bg-white/10 hover:bg-white/20 text-white rounded"
                      disabled={isProcessingImage || !getMainReferenceImage()}
                    >
                      {isProcessingImage ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reference Images */}
            {referenceImages.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/60">Reference Images:</span>
                  <span className="text-xs text-white/40">({referenceImages.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {referenceImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Reference ${index + 1}`}
                        className="h-16 w-16 object-cover rounded-lg border border-white/20"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReferenceImage(index)}
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div> {/* Close collapsible content */}
          </div>
        </div>
      )}



      {/* Edit Mode Banner */}
      {editingMessageId && (
        <div className="border-t border-orange-500/30 bg-orange-500/10 backdrop-blur-md p-3 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-orange-300 text-sm">
              <Edit3 className="h-4 w-4" />
              <span>Editing message • Click ✓ to save or ✗ to cancel</span>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-white/10 bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative flex items-end gap-2 sm:gap-3">
            {/* Image Upload and Mode Toggle Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 p-0 border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                disabled={isProcessing || isProcessingImage || !isPuterLoaded}
                title="Upload main image"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              {/* Mode Switching Dropdown - Desktop Only */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0 border-white/20 rounded-2xl transition-all duration-200",
                        isCreateMode 
                          ? "bg-orange-500/20 border-orange-500/40 text-orange-300" 
                          : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      )}
                      disabled={isProcessing || isProcessingImage || !isPuterLoaded}
                      title={isCreateMode ? "🎨 Create Mode" : "✏️ Edit Mode"}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="bg-black/90 border-white/20 text-white backdrop-blur-md"
                  >
                    <DropdownMenuLabel className="text-white/80">Select Mode</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem 
                      onClick={() => setIsCreateMode(true)}
                      className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-orange-400" />
                      Create Mode
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsCreateMode(false)}
                      className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                    >
                      <Edit3 className="mr-2 h-4 w-4 text-blue-400" />
                      Edit Mode
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Textarea
              ref={textareaRef}
              placeholder={isPuterLoaded 
                ? (editingMessageId 
                    ? "Edit your message..."
                    : (isCreateMode 
                        ? "Describe what you want to create from scratch..." 
                        : "Describe what you want to edit"))
                : "Loading Nano Banana AI..."
              }
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1 pr-14 sm:pr-16 min-h-[48px] sm:min-h-[56px] max-h-[120px] resize-none border-2 transition-all duration-200 focus:ring-2 focus:ring-white/20 rounded-xl sm:rounded-2xl bg-white/10 placeholder:text-white/50 text-white text-sm sm:text-base backdrop-blur-sm",
                editingMessageId 
                  ? "border-orange-500/40 focus:border-orange-500/60" 
                  : "border-white/20 focus:border-white/40"
              )}
              disabled={isProcessing || isProcessingImage || !isPuterLoaded}
            />
            
            {editingMessageId ? (
              <>
                <Button
                  size="icon"
                  className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 transition-all duration-300 rounded-xl sm:rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                  onClick={handleCancelEdit}
                  disabled={isProcessing || isProcessingImage || !isPuterLoaded}
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 transition-all duration-300 rounded-xl sm:rounded-2xl bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                  onClick={handleSaveEdit}
                  disabled={!input.trim() || isProcessing || isProcessingImage || !isPuterLoaded}
                >
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                className={cn(
                  "h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 transition-all duration-300 rounded-xl sm:rounded-2xl",
                  ((isTyping || selectedImage) || (isCreateMode && isTyping)) && !isProcessing && !isProcessingImage
                    ? "bg-white text-black hover:bg-white/90 shadow-2xl hover:scale-110"
                    : "bg-white/20 hover:bg-white/30 text-white/70 border border-white/20"
                )}
                onClick={handleSend}
                disabled={
                  (isCreateMode ? !input.trim() : (!input.trim() && !selectedImage)) || 
                  isProcessing || 
                  isProcessingImage || 
                  !isPuterLoaded
                }
              >
                <SendHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            )}
          </div>
          
          {(isProcessing || isProcessingImage) && (
            <div className="flex justify-center mt-6 animate-in fade-in duration-200">
              <Badge variant="outline" className="animate-pulse bg-white/20 text-white border-white/30 px-4 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isProcessingImage ? "Processing your image" : "Processing your image"}
              </Badge>
              {isProcessingImage && retryAttempt > 0 && (
                <div className="mt-2 text-center">
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-2 py-1 text-xs">
                      🔄 Retry attempt {retryAttempt}/3
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-white/50 text-center mt-4">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={refFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleReferenceImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default ChatInterface;
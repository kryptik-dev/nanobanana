import ReactMarkdown from 'react-markdown';
import { Message } from '@/lib/types';
import { Clock, Copy, Check, Heart, Download, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfilePicture from './ProfilePicture';
import { useState, useMemo, useEffect } from 'react';

interface MessageBubbleProps {
  message: Message;
  userProfilePicture?: string;
  aiProfilePicture?: string;
  onEditMessage?: (messageId: string, content: string) => void;
  isEditing?: boolean;
}

const MessageBubble = ({ 
  message, 
  userProfilePicture,
  aiProfilePicture,
  onEditMessage,
  isEditing
}: MessageBubbleProps) => {
  const isUser = useMemo(() => message.role === 'user', [message.role]);
  const isStreaming = useMemo(() => message.id === 'streaming', [message.id]);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  // Debug logging for images
  useEffect(() => {
    if (message.images && message.images.length > 0) {
      console.log(`MessageBubble ${message.role} message images:`, message.images);
    }
  }, [message.images, message.role]);

  // Auto-download functionality removed - users can manually download if needed

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      console.log(`Image downloaded: ${filename}`);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback to old method if fetch fails
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  return (
    <div className="flex w-full mb-4 group">
      {/* User messages on the right */}
      {isUser ? (
        <div className="flex flex-col items-end w-full">
          {/* Message bubble */}
          <div className="flex items-end gap-2 max-w-[80%]">
                <div 
              className={cn(
                "relative px-4 py-2 rounded-2xl shadow-sm",
                "bg-white/20 text-white border border-white/30",
                "rounded-br-md" // Chat bubble tail effect
              )}
            >
                            {message.content && (
                <ReactMarkdown
                  components={{
                                          code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                        <pre className="bg-white/20 rounded-lg p-2 overflow-x-auto border border-white/30 my-2 text-xs">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-white/20 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    a: ({ children, href }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-200 hover:text-blue-100 underline transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-white/50 pl-3 italic text-white/90 bg-white/10 rounded-r-lg py-2 my-2">
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 my-2">
                        {children}
                    </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 my-2">
                        {children}
                      </ol>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold mt-2 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-medium mt-2 mb-1">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              
              {/* Display images for user messages */}
              {message.images && message.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.images.map((image, index) => (
                    <div key={index} className="relative group">
                      {image.type === 'input' ? (
                        // Input images: small square thumbnails
                        <div className="flex flex-wrap gap-2">
                          <img
                            src={image.url}
                            alt={image.alt || `Input ${index + 1}`}
                            className="h-16 w-16 object-cover rounded-2xl border border-white/20 shadow-lg"
                            onError={(e) => console.error('Image failed to load:', image.url, e)}
                            onLoad={() => console.log('Image loaded successfully:', image.url)}
                          />
                          {image.alt && (
                            <span className="text-xs text-white/60 self-center">
                              {image.alt}
                            </span>
                          )}
                        </div>
                      ) : (
                        // Output images: larger display with download button
                        <div>
                          <img
                            src={image.url}
                            alt={image.alt || `Generated ${index + 1}`}
                            className="max-w-full h-auto rounded-2xl border border-white/20 shadow-lg"
                          />
                                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadImage(image.url, `generated-image-${Date.now()}-${index + 1}.png`)}
                              className="bg-white/20 text-white border-white/40 hover:bg-white/30"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* User profile picture */}
            <ProfilePicture
              src={userProfilePicture || message.profilePicture}
              alt="User profile"
              fallback="You"
              isUser={true}
              size="md"
            />
          </div>
          
          {/* Time stamp and edit button */}
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {formatTime(message.createdAt)}
            {onEditMessage && (
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 bg-transparent hover:bg-white/10 text-white/60 hover:text-white/80 rounded-full"
                onClick={() => onEditMessage(message.id, message.content)}
                title="Edit message"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* AI messages on the left */
        <div className="flex flex-col items-start w-full">
          {/* Message bubble */}
          <div className="flex items-end gap-2 max-w-[80%]">
            {/* AI profile picture */}
            <ProfilePicture
              src={aiProfilePicture || message.profilePicture}
              alt="AI profile"
              fallback="NB"
              isUser={false}
              size="md"
            />
            
            <div className="relative">
      <div 
        className={cn(
                  "relative px-4 py-2 rounded-2xl shadow-sm",
                  "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600",
                  "rounded-bl-md", // Chat bubble tail effect
                  isStreaming && "animate-pulse"
                )}
              >
                {/* Action Buttons - Only for AI messages */}
                {!isStreaming && (
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                      onClick={handleLike}
                    >
                      <Heart className={cn("h-3 w-3", liked && "fill-red-500 text-red-500")} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
        </div>
                )}
                
        {message.content && (
                  <ReactMarkdown
                    components={{
                      code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                          <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 overflow-x-auto border border-gray-200 dark:border-gray-600 my-2 text-xs">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      a: ({ children, href }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 underline transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-white/30 pl-3 italic text-white/70 bg-white/10 rounded-r-lg py-2 my-2">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 my-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 my-2">
                          {children}
                        </ol>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-semibold mt-2 mb-2">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-medium mt-2 mb-1">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
                
                {/* Display images if present */}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.images.map((image, index) => (
                      <div key={index} className="relative group">
                        {image.type === 'input' ? (
                          // Input images: small square thumbnails
                          <div className="flex flex-wrap gap-2">
                            <img
                              src={image.url}
                              alt={image.alt || `Input ${index + 1}`}
                              className="h-16 w-16 object-cover rounded-lg border border-white/20 shadow-lg"
                            />
                            {image.alt && (
                              <span className="text-xs text-white/60 self-center">
                                {image.alt}
                              </span>
                            )}
                          </div>
                        ) : (
                          // Output images: larger display with download button
                          <div>
                            <img
                              src={image.url}
                              alt={image.alt || `Generated ${index + 1}`}
                              className="max-w-full h-auto rounded-2xl border border-white/20 shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
                                                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadImage(image.url, `generated-image-${Date.now()}-${index + 1}.png`)}
                              className="bg-white/20 text-white border-white/40 hover:bg-white/30"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Time stamp and typing indicator */}
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {formatTime(message.createdAt)}
            {isStreaming && (
              <Badge variant="outline" className="ml-2 animate-pulse bg-white/20 text-white border-white/30">
                typing...
              </Badge>
            )}
      </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
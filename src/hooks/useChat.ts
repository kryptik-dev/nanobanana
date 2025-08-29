import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Model } from '@/lib/types';
import { MODELS } from '@/lib/constants';
import { githubAIClient, GitHubAIMessage } from '@/lib/github-ai';

export const useChat = () => {
  const [sessions, setSessions] = useState<{ [sessionId: string]: Message[] }>({});
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentModel, setCurrentModel] = useState<Model>(MODELS[0]);
  const [streamingContent, setStreamingContent] = useState('');

  // Send a message to the AI
  const sendMessage = useCallback(async (content: string) => {
    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setStreamingContent('');

    try {
      // Prepare messages for GitHub AI
      const aiMessages: GitHubAIMessage[] = [
        { role: 'system', content: currentModel.systemPrompt },
        { role: 'user', content }
      ];

      // Use streaming for real-time response
      const response = await githubAIClient.streamChat(
        aiMessages,
        currentModel.id,
        2048,
        (chunk) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // Create AI message after streaming completes
      const aiMessage: Message = {
        id: uuidv4(),
        content: response.content,
        role: 'assistant',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error by creating an error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        role: 'assistant',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [currentModel]);

  // Add a message with images (for AI responses with generated images)
  const addMessageWithImages = useCallback((content: string, images: Array<{ url: string; type: 'input' | 'output'; alt?: string }>) => {
    const message: Message = {
      id: uuidv4(),
      content,
      role: 'assistant',
      createdAt: new Date(),
      images,
    };

    setMessages((prev) => [...prev, message]);
  }, []);

  // Create a new session
  const createNewSession = useCallback(() => {
    const newSessionId = crypto.randomUUID();
    const newSession: Message[] = [];
    
    setSessions(prev => {
      const updatedSessions = {
        ...prev,
        [newSessionId]: newSession
      };
      
      // Save to localStorage
      localStorage.setItem('ninjajs-sessions', JSON.stringify(updatedSessions));
      localStorage.setItem('ninjajs-current-session', newSessionId);
      
      return updatedSessions;
    });
    
    setCurrentSessionId(newSessionId);
    setMessages(newSession);
    setStreamingContent('');
    setIsProcessing(false);
    
    return newSessionId;
  }, []);

  // Switch to a different session
  const switchSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      if (prev[sessionId]) {
        setCurrentSessionId(sessionId);
        setMessages(prev[sessionId]);
        setStreamingContent('');
        setIsProcessing(false);
        localStorage.setItem('ninjajs-current-session', sessionId);
      }
      return prev;
    });
  }, []);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[sessionId];
      
      // Save to localStorage
      localStorage.setItem('ninjajs-sessions', JSON.stringify(newSessions));
      
      return newSessions;
    });
    
    // If we deleted the current session, create a new one
    if (sessionId === currentSessionId) {
      // Create new session without circular dependency
      const newSessionId = crypto.randomUUID();
      const newSession: Message[] = [];
      
      setSessions(prev => ({
        ...prev,
        [newSessionId]: newSession
      }));
      
      setCurrentSessionId(newSessionId);
      setMessages(newSession);
      setStreamingContent('');
      setIsProcessing(false);
      
      // No localStorage - just update state
    }
  }, [currentSessionId]);

  // Reset current chat history
  const resetChat = useCallback(() => {
    const newSession: Message[] = [];
    setMessages(newSession);
    setStreamingContent('');
    setIsProcessing(false);
    
    // Update sessions
    setSessions(prev => {
      const updatedSessions = {
        ...prev,
        [currentSessionId]: newSession
      };
      
      // No localStorage - just update state
      
      return updatedSessions;
    });
  }, [currentSessionId]);

  // Keep messages in memory only - no localStorage
  useEffect(() => {
    if (currentSessionId) {
      // Update sessions state to trigger sidebar re-render
      setSessions(prev => {
        const newSessions = {
          ...prev,
          [currentSessionId]: messages
        };
        return newSessions;
      });
    }
  }, [messages, currentSessionId]);

  // Initialize with a new session - no localStorage loading
  useEffect(() => {
    createNewSession();
  }, [createNewSession]);

  return {
    messages,
    isProcessing,
    currentModel,
    setCurrentModel,
    sendMessage,
    streamingContent,
    resetChat,
    addMessageWithImages,
    setMessages,
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSession
  };
};
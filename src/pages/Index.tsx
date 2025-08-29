import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw,
  Home,
  Image,
  Sparkles,
  Upload,
  Download,
  X,
  LogOut
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Index() {
  const [isPuterLoaded, setIsPuterLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { 
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
  } = useChat();
  const { user, signOut } = useAuth();

  // Profile pictures - using images from public/images
  const userProfilePicture = "/images/user.jpg";
  const aiProfilePicture = "/images/claude-logo.png";

  // Check if Puter.js is loaded
  useEffect(() => {
    const checkPuterLoaded = setInterval(() => {
      if (window.puter) {
        setIsPuterLoaded(true);
        clearInterval(checkPuterLoaded);
      }
    }, 500);

    return () => clearInterval(checkPuterLoaded);
  }, []);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <Header 
        resetChat={resetChat} 
        createNewSession={createNewSession}
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
        isCreateMode={isCreateMode}
        setIsCreateMode={setIsCreateMode}
        onMobileMenuToggle={toggleMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Chat Interface - Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatInterface 
            messages={messages} 
            isProcessing={isProcessing} 
            sendMessage={sendMessage} 
            addMessageWithImages={addMessageWithImages}
            setMessages={setMessages}
            streamingContent={streamingContent}
            isPuterLoaded={isPuterLoaded}
            userProfilePicture={userProfilePicture}
            aiProfilePicture={aiProfilePicture}
            isCreateMode={isCreateMode}
            setIsCreateMode={setIsCreateMode}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden lg:flex border-l border-white/10 bg-black/80 backdrop-blur-md transition-all duration-300 shadow-xl custom-scrollbar",
          sidebarCollapsed ? "w-16" : "w-80"
        )}>
          <div className="flex flex-col w-full">
            {/* Sidebar Header */}
            <div className={cn(
              "border-b border-white/10 bg-white/5 backdrop-blur-sm",
              sidebarCollapsed ? "p-4 relative" : "p-6"
            )}>
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-black font-black text-xl">NB</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Nano Banana
                        </h2>
                        <p className="text-sm text-white/70 font-medium">
                          AI Image Creator & Editor
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {sidebarCollapsed && (
                  <div className="flex justify-center w-full">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-black font-black text-xl">NB</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Sidebar Content - Only show when expanded */}
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-auto p-6 space-y-8 custom-scrollbar">
                {/* Home Link */}
                <div className="space-y-3">
                  <Link to="/">
                    <Button
                      variant="outline"
                      className="w-full justify-start p-4 h-auto hover:bg-white/10 text-white hover:text-white rounded-lg border-white/20 hover:border-white/40 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Home className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium">Back to Home</span>
                      </div>
                    </Button>
                  </Link>
                </div>

                {/* Session Management Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      Chat Sessions
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createNewSession}
                      className="h-7 px-2 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                    >
                      New Chat
                    </Button>
                  </div>
                  
                  {/* Sessions List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {Object.keys(sessions).map((sessionId) => (
                      <div
                        key={sessionId}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
                          sessionId === currentSessionId
                            ? "bg-white/20 border border-white/40"
                            : "bg-white/10 border border-white/20 hover:bg-white/15"
                        )}
                        onClick={() => switchSession(sessionId)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {sessions[sessionId].length > 0 
                              ? sessions[sessionId][0]?.content?.substring(0, 30) + '...' 
                              : 'New Chat'
                            }
                          </p>
                          <p className="text-xs text-white/60">
                            {sessions[sessionId].length} messages
                          </p>
                        </div>
                        {sessionId === currentSessionId && (
                          <Badge variant="outline" className="text-xs bg-white/30 text-white border-white/50">
                            Active
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(sessionId);
                          }}
                          className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/20 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Model Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    AI Model
                  </h3>
                  <Card className="border-white/20 bg-white/10 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-xl shadow-sm">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">Nano Banana AI</p>
                            <p className="text-xs text-white/70 truncate">AI Image Creator & Editor</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                            Image Generation
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                            Image Editing
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                            AI Powered
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>



                {/* Session Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                    Session Info
                  </h3>
                  <Card className="border-white/20 bg-white/10 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Messages</span>
                        <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                          {messages.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Status</span>
                        <Badge variant={isProcessing ? "destructive" : "default"} className="text-xs">
                          {isProcessing ? "Processing" : "Ready"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Model</span>
                        <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                          Nano Banana
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4">
                  <div className="space-y-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    {/* User Email */}
                    {user && (
                      <div className="px-4 py-2 text-sm text-white/50">
                        {user.email}
                      </div>
                    )}
                    
                    {/* Sign Out Button */}
                    {user && (
                      <div className="px-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={signOut}
                          className="w-full h-9 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-xs"
                        >
                          <LogOut className="h-3 w-3 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-left space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Image className="h-3 w-3" />
                        Powered by Nano Banana
                      </div>
                      <div className="text-xs text-white/50">
                        AI Image Creator & Editor
                      </div>
                      <div className="pt-2">
                        <a 
                          href="https://amaandildar.onrender.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200 cursor-pointer"
                        >
                          Made by кяуρтιк
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out ${
              mobileSidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobileSidebar}
          />
          
          {/* Mobile Sidebar */}
          <div className={`absolute right-0 top-0 h-full w-80 bg-black/95 backdrop-blur-md border-l border-white/10 shadow-2xl transform transition-all duration-300 ease-in-out ${
            mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
              <div className="flex flex-col h-full">
                {/* Mobile Sidebar Header */}
                <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-black font-black text-lg">NB</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Nano Banana</h2>
                        <p className="text-sm text-white/70">AI Image Creator & Editor</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeMobileSidebar}
                      className="h-8 w-8 p-0 text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Sidebar Content */}
                <div className="flex-1 overflow-auto p-4 space-y-6 custom-scrollbar">
                  {/* Home Link */}
                  <div className="space-y-3">
                    <Link to="/" onClick={closeMobileSidebar}>
                      <Button
                        variant="outline"
                        className="w-full justify-start p-3 h-auto hover:bg-white/10 text-white hover:text-white rounded-lg border-white/20 hover:border-white/40 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <Home className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Back to Home</span>
                        </div>
                      </Button>
                    </Link>
                  </div>

                  {/* Session Management Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                        Chat Sessions
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          createNewSession();
                          closeMobileSidebar();
                        }}
                        className="h-7 px-2 text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                      >
                        New Chat
                      </Button>
                    </div>
                    
                    {/* Sessions List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {Object.keys(sessions).map((sessionId) => (
                        <div
                          key={sessionId}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
                            currentSessionId === sessionId
                              ? "bg-white/20 border border-white/30"
                              : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20"
                          )}
                          onClick={() => {
                            switchSession(sessionId);
                            closeMobileSidebar();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-white/60"></div>
                            <span className="text-sm text-white/80 truncate">
                              Session {sessionId.slice(-4)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(sessionId);
                            }}
                            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Model Card */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">
                      AI Model
                    </h3>
                    <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-white">Nano Banana AI</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                            Image Generation
                          </Badge>
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">
                            AI-Powered
                          </Badge>
                        </div>
                        <p className="text-xs text-white/70">
                          Advanced AI Image Creator & Editor powered by cutting-edge machine learning.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-white/10">
                    {/* User Email */}
                    {user && (
                      <div className="px-4 py-2 text-sm text-white/50 mb-4">
                        {user.email}
                      </div>
                    )}
                    
                    {/* Sign Out Button */}
                    {user && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            signOut();
                            closeMobileSidebar();
                          }}
                          className="w-full h-9 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 text-xs"
                        >
                          <LogOut className="h-3 w-3 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-left space-y-2">
                      <p className="text-xs text-white/50">
                        AI Image Creator & Editor
                      </p>
                      <a 
                        href="https://amaandildar.onrender.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        Made by кяуρтιк
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePictureProps {
  src?: string;
  alt?: string;
  fallback?: string;
  isUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProfilePicture = ({ 
  src, 
  alt, 
  fallback, 
  isUser = false, 
  size = 'md',
  className 
}: ProfilePictureProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const getFallbackContent = () => {
    if (fallback) {
      return fallback.slice(0, 2).toUpperCase();
    }
    return isUser ? <User className={iconSizes[size]} /> : <Bot className={iconSizes[size]} />;
  };

  const getGradient = () => {
    if (isUser) {
      return 'bg-white/20 border border-white/30';
    }
    return 'bg-white/20 border border-white/30';
  };

  return (
    <Avatar className={cn(
      sizeClasses[size],
      getGradient(),
      "flex-shrink-0",
      className
    )}>
      {src ? (
        <AvatarImage 
          src={src} 
          alt={alt || (isUser ? 'User profile' : 'AI profile')}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className="text-white font-semibold text-xs">
        {getFallbackContent()}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfilePicture; 
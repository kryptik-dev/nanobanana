import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Thermometer, 
  MessageSquare, 
  ScrollText, 
  Code, 
  Zap,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SettingsPanel = () => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [markdownRendering, setMarkdownRendering] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  const getTemperatureLabel = (value: number) => {
    if (value <= 0.3) return 'Focused';
    if (value <= 0.7) return 'Balanced';
    return 'Creative';
  };

  const getTokenLabel = (value: number) => {
    if (value <= 500) return 'Short';
    if (value <= 1000) return 'Medium';
    return 'Long';
  };

  return (
    <div className="space-y-4">
      {/* AI Behavior Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">AI Behavior</h4>
        </div>
        
        {/* Temperature */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Temperature</Label>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getTemperatureLabel(temperature)}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  {temperature.toFixed(1)}
                </span>
              </div>
            </div>
            
            <Slider 
              min={0} 
              max={1} 
              step={0.1} 
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              className="w-full"
            />
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Controls randomness. Lower values make responses more focused and deterministic.
            </p>
          </CardContent>
        </Card>

        {/* Max Tokens */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Max Response Length</Label>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getTokenLabel(maxTokens)}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  {maxTokens}
                </span>
              </div>
            </div>
            
            <Slider 
              min={100} 
              max={2000} 
              step={100}
              value={[maxTokens]}
              onValueChange={(value) => setMaxTokens(value[0])}
              className="w-full"
            />
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Maximum number of tokens to generate in response.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interface Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Interface</h4>
        </div>
        
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-4">
            {/* Auto Scroll */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ScrollText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium cursor-pointer">Auto Scroll</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically scroll to new messages
                  </p>
                </div>
              </div>
              <Switch
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
            </div>

            {/* Markdown Rendering */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium cursor-pointer">Markdown Rendering</Label>
                  <p className="text-xs text-muted-foreground">
                    Format code blocks and links
                  </p>
                </div>
              </div>
              <Switch
                checked={markdownRendering}
                onCheckedChange={setMarkdownRendering}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Settings Note</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                These settings affect how the AI responds and how the interface behaves. 
                Changes are applied immediately to new conversations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
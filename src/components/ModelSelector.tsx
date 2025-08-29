import { Card, CardContent } from '@/components/ui/card';
import { MODELS } from '@/lib/constants';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Model } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  currentModel: Model;
  setCurrentModel: (model: Model) => void;
}

const ModelSelector = ({ currentModel, setCurrentModel }: ModelSelectorProps) => {
  const getModelIcon = (modelId: string) => {
    switch (modelId) {
      case 'claude-opus-4':
        return <Brain className="h-4 w-4" />;
      case 'claude-sonnet-4':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getModelBadge = (modelId: string) => {
    switch (modelId) {
      case 'claude-opus-4':
        return { text: 'Most Powerful', variant: 'default' as const };
      case 'claude-sonnet-4':
        return { text: 'Balanced', variant: 'secondary' as const };
      default:
        return { text: 'Standard', variant: 'outline' as const };
    }
  };

  return (
    <div className="space-y-3">
      <RadioGroup 
        value={currentModel.id} 
        onValueChange={(value) => {
          const model = MODELS.find(m => m.id === value);
          if (model) setCurrentModel(model);
        }}
        className="space-y-3"
      >
        {MODELS.map((model) => {
          const isSelected = currentModel.id === model.id;
          const badge = getModelBadge(model.id);
          
          return (
            <Card 
              key={model.id} 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-primary/20 bg-primary/5 border-primary/30" 
                  : "hover:bg-muted/50"
              )}
              onClick={() => setCurrentModel(model)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem 
                    value={model.id} 
                    id={model.id}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "p-1.5 rounded-md",
                        isSelected 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {getModelIcon(model.id)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={model.id} 
                          className="cursor-pointer font-semibold text-base"
                        >
                          {model.name}
                        </Label>
                      </div>
                      
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.text}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {model.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((capability, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs bg-background/50"
                        >
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default ModelSelector;
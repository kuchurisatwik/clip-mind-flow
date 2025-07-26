import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Link, 
  Image, 
  Code, 
  MoreHorizontal,
  Clock,
  Pin,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ClipType = "text" | "link" | "image" | "code" | "other";
export type Priority = "high" | "medium" | "low";

interface ClipCardProps {
  id: string;
  content: string;
  type: ClipType;
  priority: Priority;
  timestamp: Date;
  isPinned?: boolean;
  sourceUrl?: string;
  summary?: string;
  onPin?: (id: string) => void;
  onCopy?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeIcons = {
  text: FileText,
  link: Link,
  image: Image,
  code: Code,
  other: MoreHorizontal,
};

const typeColors = {
  text: "text-category-text",
  link: "text-category-link", 
  image: "text-category-image",
  code: "text-category-code",
  other: "text-category-other",
};

const priorityColors = {
  high: "bg-priority-high text-white",
  medium: "bg-priority-medium text-white",
  low: "bg-priority-low text-white",
};

export const ClipCard = ({
  id,
  content,
  type,
  priority,
  timestamp,
  isPinned = false,
  sourceUrl,
  summary,
  onPin,
  onCopy,
  onDelete,
}: ClipCardProps) => {
  const Icon = typeIcons[type];
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const truncateContent = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden bg-gradient-card border-border/50 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02] cursor-pointer",
      isPinned && "ring-2 ring-primary/20"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", typeColors[type])} />
            <Badge variant="secondary" className={cn("text-xs", priorityColors[priority])}>
              {priority}
            </Badge>
            {isPinned && <Pin className="h-3 w-3 text-primary" />}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onPin?.(id);
              }}
            >
              <Star className={cn("h-3 w-3", isPinned && "fill-current text-primary")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {truncateContent(content)}
          </p>
          
          {summary && (
            <p className="text-xs text-muted-foreground italic">
              {summary}
            </p>
          )}
          
          {sourceUrl && (
            <p className="text-xs text-category-link underline">
              {new URL(sourceUrl).hostname}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(timestamp)}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.(id);
            }}
          >
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
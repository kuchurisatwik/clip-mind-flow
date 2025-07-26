import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles } from "lucide-react";
import { ClipType, Priority } from "./ClipCard";
import { useToast } from "@/hooks/use-toast";

interface AddClipDialogProps {
  onAddClip: (clip: {
    content: string;
    type: ClipType;
    priority: Priority;
    sourceUrl?: string;
  }) => void;
}

export const AddClipDialog = ({ onAddClip }: AddClipDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<ClipType>("text");
  const [priority, setPriority] = useState<Priority>("medium");
  const [sourceUrl, setSourceUrl] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your clip.",
        variant: "destructive",
      });
      return;
    }

    onAddClip({
      content: content.trim(),
      type,
      priority,
      sourceUrl: sourceUrl.trim() || undefined,
    });

    // Reset form
    setContent("");
    setType("text");
    setPriority("medium");
    setSourceUrl("");
    setOpen(false);

    toast({
      title: "Clip added successfully!",
      description: "Your new clip has been saved to ClipMaster AI.",
    });
  };

  const detectType = (text: string): ClipType => {
    if (text.includes("http://") || text.includes("https://")) return "link";
    if (text.includes("function") || text.includes("class") || text.includes("import")) return "code";
    if (text.includes("data:image") || text.match(/\.(jpg|jpeg|png|gif|svg)$/i)) return "image";
    return "text";
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    // Auto-detect type
    const detectedType = detectType(value);
    setType(detectedType);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="default">
          <Plus className="h-4 w-4" />
          Add Clip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add New Clip
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Paste or type your content here..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[100px] resize-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ClipType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (optional)</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://example.com"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Clip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
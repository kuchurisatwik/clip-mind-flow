import { useState, useMemo } from "react";
import { ClipCard, ClipType, Priority } from "@/components/ClipCard";
import { SearchBar } from "@/components/SearchBar";
import { ClipStats } from "@/components/ClipStats";
import { AddClipDialog } from "@/components/AddClipDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clipboard, Sparkles, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Clip {
  id: string;
  content: string;
  type: ClipType;
  priority: Priority;
  timestamp: Date;
  isPinned: boolean;
  sourceUrl?: string;
  summary?: string;
}

const Index = () => {
  const [clips, setClips] = useState<Clip[]>([
    {
      id: "1",
      content: "const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);",
      type: "code",
      priority: "high",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isPinned: true,
      summary: "Recursive Fibonacci function implementation"
    },
    {
      id: "2", 
      content: "https://github.com/microsoft/TypeScript/releases/tag/v5.3.0",
      type: "link",
      priority: "medium",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isPinned: false,
      sourceUrl: "https://github.com",
      summary: "TypeScript 5.3.0 release notes"
    },
    {
      id: "3",
      content: "Remember to update the API documentation after implementing the new authentication flow. Include examples for JWT token refresh and error handling scenarios.",
      type: "text", 
      priority: "high",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isPinned: false,
      summary: "Documentation update reminder for auth flow"
    },
    {
      id: "4",
      content: "docker run -d --name postgres -e POSTGRES_PASSWORD=mypassword -p 5432:5432 postgres:15",
      type: "code",
      priority: "low",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isPinned: false,
      summary: "Docker command for PostgreSQL setup"
    },
    {
      id: "5",
      content: "Meeting notes: Discussed Q4 roadmap, prioritizing performance improvements and mobile app development. Need to finalize timeline by Friday.",
      type: "text",
      priority: "medium", 
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isPinned: false,
      summary: "Q4 roadmap meeting summary"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ClipType | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "all">("all");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Filter clips based on search and filters
  const filteredClips = useMemo(() => {
    return clips.filter((clip) => {
      const matchesSearch = clip.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (clip.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesType = selectedType === "all" || clip.type === selectedType;
      const matchesPriority = selectedPriority === "all" || clip.priority === selectedPriority;
      const matchesTab = activeTab === "all" || clip.type === activeTab;
      
      return matchesSearch && matchesType && matchesPriority && matchesTab;
    }).sort((a, b) => {
      // Sort by pinned first, then by timestamp
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [clips, searchQuery, selectedType, selectedPriority, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const typeDistribution = clips.reduce((acc, clip) => {
      acc[clip.type] = (acc[clip.type] || 0) + 1;
      return acc;
    }, {} as Record<ClipType, number>);

    const pinnedCount = clips.filter(clip => clip.isPinned).length;
    const todayCount = clips.filter(clip => {
      const today = new Date();
      const clipDate = clip.timestamp;
      return clipDate.toDateString() === today.toDateString();
    }).length;

    return {
      totalClips: clips.length,
      typeDistribution,
      pinnedCount,
      todayCount,
    };
  }, [clips]);

  const handleAddClip = (newClip: {
    content: string;
    type: ClipType;
    priority: Priority;
    sourceUrl?: string;
  }) => {
    const clip: Clip = {
      id: Date.now().toString(),
      ...newClip,
      timestamp: new Date(),
      isPinned: false,
      summary: generateSummary(newClip.content, newClip.type),
    };
    setClips(prev => [clip, ...prev]);
  };

  const generateSummary = (content: string, type: ClipType): string => {
    if (type === "link") return "Web link";
    if (type === "code") return "Code snippet";
    if (type === "image") return "Image content";
    
    const words = content.split(' ').slice(0, 8).join(' ');
    return words.length < content.length ? words + "..." : words;
  };

  const handlePin = (id: string) => {
    setClips(prev => prev.map(clip => 
      clip.id === id ? { ...clip, isPinned: !clip.isPinned } : clip
    ));
    
    const clip = clips.find(c => c.id === id);
    toast({
      title: clip?.isPinned ? "Clip unpinned" : "Clip pinned",
      description: clip?.isPinned ? "Removed from pinned clips" : "Added to pinned clips",
    });
  };

  const handleCopy = async (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (clip) {
      try {
        await navigator.clipboard.writeText(clip.content);
        toast({
          title: "Copied to clipboard",
          description: "Content has been copied to your clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Unable to copy content to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = (id: string) => {
    setClips(prev => prev.filter(clip => clip.id !== id));
    toast({
      title: "Clip deleted",
      description: "The clip has been removed from your history",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Clipboard className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ClipMaster AI
              </h1>
            </div>
            <p className="text-muted-foreground">
              Your intelligent clipboard manager with AI-powered organization
            </p>
          </div>
          <AddClipDialog onAddClip={handleAddClip} />
        </div>

        {/* Stats */}
        <ClipStats {...stats} />

        {/* Search & Filters */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedType={selectedType}
          selectedPriority={selectedPriority}
          onTypeChange={setSelectedType}
          onPriorityChange={setSelectedPriority}
        />

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-2xl">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-0">
            {filteredClips.length === 0 ? (
              <div className="text-center py-12">
                <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No clips found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search or filters" : "Start by adding your first clip"}
                </p>
                {!searchQuery && (
                  <AddClipDialog onAddClip={handleAddClip} />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    {...clip}
                    onPin={handlePin}
                    onCopy={handleCopy}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

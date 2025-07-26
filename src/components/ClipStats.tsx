import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Link, 
  Image, 
  Code, 
  MoreHorizontal,
  TrendingUp,
  Star,
  Clock
} from "lucide-react";
import { ClipType } from "./ClipCard";

interface ClipStatsProps {
  totalClips: number;
  typeDistribution: Record<ClipType, number>;
  pinnedCount: number;
  todayCount: number;
}

export const ClipStats = ({
  totalClips,
  typeDistribution,
  pinnedCount,
  todayCount,
}: ClipStatsProps) => {
  const stats = [
    {
      label: "Total Clips",
      value: totalClips,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Pinned",
      value: pinnedCount,
      icon: Star,
      color: "text-priority-medium",
    },
    {
      label: "Today",
      value: todayCount,
      icon: Clock,
      color: "text-category-text",
    },
  ];

  const typeStats = [
    { type: "text", icon: FileText, color: "text-category-text" },
    { type: "link", icon: Link, color: "text-category-link" },
    { type: "image", icon: Image, color: "text-category-image" },
    { type: "code", icon: Code, color: "text-category-code" },
    { type: "other", icon: MoreHorizontal, color: "text-category-other" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Main Stats */}
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Type Distribution */}
      <Card className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-200 md:col-span-2 lg:col-span-3">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Content Types</h3>
          <div className="grid grid-cols-5 gap-4">
            {typeStats.map(({ type, icon: Icon, color }) => (
              <div key={type} className="text-center">
                <div className="flex flex-col items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <span className="text-xl font-bold text-foreground">
                    {typeDistribution[type as ClipType] || 0}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
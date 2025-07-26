import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipType, Priority } from "./ClipCard";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType?: ClipType | "all";
  selectedPriority?: Priority | "all";
  onTypeChange: (type: ClipType | "all") => void;
  onPriorityChange: (priority: Priority | "all") => void;
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  selectedType = "all",
  selectedPriority = "all",
  onTypeChange,
  onPriorityChange,
}: SearchBarProps) => {
  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "text", label: "Text" },
    { value: "link", label: "Links" },
    { value: "image", label: "Images" },
    { value: "code", label: "Code" },
    { value: "other", label: "Other" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "low", label: "Low Priority" },
  ];

  return (
    <div className="flex gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your clipboard history..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border/50 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200"
        />
      </div>

      {/* Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[120px] justify-between">
            {typeOptions.find(opt => opt.value === selectedType)?.label}
            <Filter className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {typeOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onTypeChange(option.value as ClipType | "all")}
              className="cursor-pointer"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[140px] justify-between">
            {priorityOptions.find(opt => opt.value === selectedPriority)?.label}
            <Filter className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {priorityOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onPriorityChange(option.value as Priority | "all")}
              className="cursor-pointer"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
import { MythCard, MythData } from "./MythCard";
import { LucideIcon } from "lucide-react";

interface MythCategoryProps {
  title: string;
  icon: LucideIcon;
  myths: MythData[];
  startIndex: number;
}

export function MythCategory({ title, icon: Icon, myths, startIndex }: MythCategoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      
      <div className="space-y-3">
        {myths.map((myth, idx) => (
          <MythCard 
            key={myth.id} 
            myth={myth} 
            index={startIndex + idx} 
          />
        ))}
      </div>
    </div>
  );
}

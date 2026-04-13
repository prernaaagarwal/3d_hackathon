import { cn } from "@/lib/utils";

interface GoldDividerProps {
  className?: string;
}

export const GoldDivider = ({ className }: GoldDividerProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      <div className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
    </div>
  );
};


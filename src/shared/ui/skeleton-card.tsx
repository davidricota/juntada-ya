import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface SkeletonCardProps {
  header?: {
    title?: boolean;
    description?: boolean;
    meta?: boolean;
    actions?: number;
  };
  content?: {
    items?: number;
    itemHeight?: string;
    itemWidth?: string;
  };
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  header = { title: true, description: true, meta: true, actions: 0 },
  content = { items: 3, itemHeight: "h-4", itemWidth: "w-full" },
  className = "",
}) => {
  return (
    <Card className={`bg-card text-card-foreground animate-pulse ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {header.title && <Skeleton className="h-6 w-56" />}
            {header.description && <Skeleton className="h-4 w-72" />}
            {header.meta && (
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
          </div>
          {header.actions > 0 && (
            <div className="flex gap-2">
              {Array.from({ length: header.actions }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-md" />
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: content.items }).map((_, i) => (
            <Skeleton key={i} className={`${content.itemHeight} ${content.itemWidth}`} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

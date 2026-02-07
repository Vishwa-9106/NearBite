import { Skeleton } from "@/components/ui/skeleton";

export const CategorySkeleton = () => (
  <div className="flex gap-4 px-4 pb-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <Skeleton className="w-[68px] h-[68px] rounded-full" />
        <Skeleton className="w-12 h-3 rounded-full" />
      </div>
    ))}
  </div>
);

export const RestaurantSkeleton = () => (
  <div className="px-4 space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="rounded-3xl overflow-hidden border border-border/50 bg-card"
      >
        <Skeleton className="w-full h-40" />
        <div className="p-3.5 space-y-2.5">
          <Skeleton className="w-3/4 h-4 rounded-full" />
          <Skeleton className="w-1/2 h-3 rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="w-1/3 h-3 rounded-full" />
            <Skeleton className="w-1/4 h-3 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

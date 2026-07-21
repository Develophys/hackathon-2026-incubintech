import { Skeleton } from "@/presentation/ui/Skeleton";

const OPTION_SKELETON_COUNT = 4;

export function QuestionCardSkeleton() {
  return (
    <div>
      <Skeleton className="mb-[26px] mt-[10px] h-7 w-3/4 rounded-md" />
      <div className="flex flex-col gap-[11px]">
        {Array.from({ length: OPTION_SKELETON_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-[52px] w-full rounded-input" />
        ))}
      </div>
    </div>
  );
}

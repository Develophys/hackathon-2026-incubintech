interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div data-testid="skeleton" className={["animate-pulse bg-line", className].join(" ")} />;
}

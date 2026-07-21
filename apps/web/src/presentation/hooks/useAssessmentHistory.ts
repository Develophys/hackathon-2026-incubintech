import { useQuery } from "@tanstack/react-query";
import { getAssessmentHistoryUseCase } from "@/app/container";

export function useAssessmentHistory() {
  return useQuery({
    queryKey: ["assessment-history"],
    queryFn: () => getAssessmentHistoryUseCase.execute(),
  });
}

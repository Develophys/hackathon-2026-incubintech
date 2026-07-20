import { useQuery } from "@tanstack/react-query";
import { getManagerInsightHistoryUseCase } from "@/app/container";
import { useManagerSessionStore } from "@/stores/manager-session.store";

export function useManagerInsightHistory() {
  const token = useManagerSessionStore((state) => state.token);

  return useQuery({
    queryKey: ["manager-insight-history", token],
    queryFn: () => getManagerInsightHistoryUseCase.execute(token!),
    enabled: token !== null,
    retry: false,
  });
}

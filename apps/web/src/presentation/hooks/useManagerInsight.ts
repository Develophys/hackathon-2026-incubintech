import { useMutation } from "@tanstack/react-query";
import { generateManagerInsightUseCase } from "@/app/container";
import { useManagerSessionStore } from "@/stores/manager-session.store";

export function useManagerInsight() {
  const token = useManagerSessionStore((state) => state.token);

  return useMutation({
    mutationFn: () => generateManagerInsightUseCase.execute(token!),
  });
}

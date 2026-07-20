import { useQuery } from "@tanstack/react-query";
import { checkApiHealthUseCase } from "@/app/container";

export function useApiHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: () => checkApiHealthUseCase.execute(),
    retry: 1,
  });
}

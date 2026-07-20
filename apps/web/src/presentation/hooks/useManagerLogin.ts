import { useMutation } from "@tanstack/react-query";
import { loginManagerUseCase } from "@/app/container";
import { useManagerSessionStore } from "@/stores/manager-session.store";

export function useManagerLogin() {
  const setSession = useManagerSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (code: string) => loginManagerUseCase.execute(code),
    onSuccess: (result) => {
      setSession(result.token, result.expiresAt);
    },
  });
}

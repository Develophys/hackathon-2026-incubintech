import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthBanner } from "../presentation/components/HealthBanner";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4 text-lg font-semibold text-slate-800">
        <HealthBanner />
        Zelo
      </div>
    </QueryClientProvider>
  );
}

import { requestHumanHandoffUseCase } from "../../app/container";

export function HumanHandoffPanel({ onClose }: { onClose: () => void }) {
  const info = requestHumanHandoffUseCase.execute();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <p className="text-slate-800">{info.message}</p>
        <p className="mt-4 text-xl font-bold text-slate-900">
          {info.externalCrisisLine.label}: {info.externalCrisisLine.phone}
        </p>
        <button
          onClick={onClose}
          className="mt-6 rounded bg-slate-800 px-4 py-2 text-white"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

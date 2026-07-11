interface QuestionCardProps {
  question: string;
  options: readonly { value: number; label: string }[];
  selected?: number;
  onSelect: (value: number) => void;
  disabled?: boolean;
}

export function QuestionCard({ question, options, selected, onSelect, disabled = false }: QuestionCardProps) {
  return (
    <div>
      <h2 className="mb-[26px] mt-[10px] font-serif text-h2 text-ink">{question}</h2>
      <div className="flex flex-col gap-[11px]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            className={`rounded-input border p-[16px_18px] text-left text-label font-semibold text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              selected === option.value ? "border-brand bg-surface-brand" : "border-line bg-surface"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

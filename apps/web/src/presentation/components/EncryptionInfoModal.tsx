import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface EncryptionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOC_LINK = "https://pt.wikipedia.org/wiki/Advanced_Encryption_Standard";

export function EncryptionInfoModal({ isOpen, onClose }: EncryptionInfoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="encryption-info-title"
        className="relative max-w-[340px] rounded-card-lg bg-surface p-[22px] shadow-card-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 text-muted"
        >
          <X size={20} />
        </button>
        <h2 id="encryption-info-title" className="pr-6 text-h2 text-ink">
          Criptografia AES-256
        </h2>
        <p className="mt-3 text-label text-ink-2">
          AES-256 é um método de criptografia usado por bancos, governos e aplicativos de
          mensagens para proteger informações sensíveis.
        </p>
        <p className="mt-3 text-label text-ink-2">
          Antes de qualquer resposta sair do seu aparelho, ela é transformada em um código que
          só pode ser lido com uma chave que existe apenas no seu dispositivo — nem o Zelo
          consegue abrir esse código.
        </p>
        <p className="mt-3 text-label text-ink-2">
          Isso significa que suas respostas ficam protegidas, e sua identidade permanece
          anônima.
        </p>
        <a
          href={DOC_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-label font-bold text-brand"
        >
          Para mais informações, acesse a documentação →
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </div>
  );
}

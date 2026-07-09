interface RedactionRule {
  label: string;
  pattern: RegExp;
}

const REDACTION_RULES: RedactionRule[] = [
  { label: "[CRM]", pattern: /CRM[\s-]?[A-Z]{0,2}\s?\d{4,7}/gi },
  { label: "[EMAIL]", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { label: "[TELEFONE]", pattern: /(\+?55\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g },
];

/**
 * Heuristic, regex-based redaction — not NLP-based PII detection. Covers the
 * identifier patterns most likely to appear in a Brazilian doctor's casual
 * text (CRM number, email, phone). This is a deliberate, documented scope
 * limit for the 28-day PoC (spec Section B, PRD FR-5), not a placeholder.
 */
export class AnonymizeTextUseCase {
  execute(rawText: string): string {
    return REDACTION_RULES.reduce((text, { label, pattern }) => text.replace(pattern, label), rawText);
  }
}

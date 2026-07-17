import { jsPDF } from "jspdf";
import type { StoredManagerInsight } from "../../ports/manager-insight-history.port";

function formatDate(generatedAt: string): string {
  return new Date(generatedAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadInsightAsText(entry: StoredManagerInsight): void {
  const lines = [
    "Análise com IA — Zelo",
    formatDate(entry.generatedAt),
    "",
    entry.interpretation,
    "",
    "Ações sugeridas:",
    ...entry.suggestedActions.map((action) => `- ${action}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `analise-zelo-${entry.id}.txt`);
}

export function downloadInsightAsPdf(entry: StoredManagerInsight): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Análise com IA — Zelo", 14, 20);
  doc.setFontSize(11);
  doc.text(formatDate(entry.generatedAt), 14, 28);
  doc.text(doc.splitTextToSize(entry.interpretation, 180), 14, 40);
  doc.text("Ações sugeridas:", 14, 70);
  entry.suggestedActions.forEach((action, index) => {
    doc.text(`- ${action}`, 14, 78 + index * 8);
  });
  doc.save(`analise-zelo-${entry.id}.pdf`);
}

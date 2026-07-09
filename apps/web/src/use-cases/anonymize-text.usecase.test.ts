import { describe, expect, it } from "vitest";
import { AnonymizeTextUseCase } from "./anonymize-text.usecase";

describe("AnonymizeTextUseCase", () => {
  const useCase = new AnonymizeTextUseCase();

  it("redacts a CRM number", () => {
    expect(useCase.execute("Meu CRM-SC 123456 está ativo")).toBe("Meu [CRM] está ativo");
  });

  it("redacts an email address", () => {
    expect(useCase.execute("me chame em joao.silva@hospital.com.br")).toBe("me chame em [EMAIL]");
  });

  it("redacts a Brazilian phone number", () => {
    expect(useCase.execute("meu telefone é (48) 99999-8888")).toBe("meu telefone é [TELEFONE]");
  });

  it("leaves text with no identifiers unchanged", () => {
    expect(useCase.execute("estou exausta depois desse plantão")).toBe(
      "estou exausta depois desse plantão",
    );
  });
});

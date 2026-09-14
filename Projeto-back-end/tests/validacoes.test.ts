import { describe, expect, it } from "vitest";
import { isStrongPassword, isValidCPF, isValidEmail } from "../src/utils/validators";

describe("🧪 TESTES DE VALIDADORES", () => {
    it("deve validar e-mail corretamente", () => {
        expect(isValidEmail("user@mail.com")).toBe(true);
        expect(isValidEmail("user@mail"), "⚠️ O VALIDADOR ACEITOU E-MAIL SEM DOMÍNIO!").toBe(false);
    });

    it("deve validar senha forte corretamente", () => {
        expect(isStrongPassword("Abc@1234")).toBe(true);
        expect(isStrongPassword("abc123"), "⚠️ O VALIDADOR ACEITOU SENHA FRACA!").toBe(false);
    });

    it("deve validar CPF corretamente", () => {
        expect(isValidCPF("52998224725")).toBe(true);
        expect(isValidCPF("11111111111"), "⚠️ O VALIDADOR ACEITOU CPF DE DÍGITOS IGUAIS!").toBe(false);
    });
});

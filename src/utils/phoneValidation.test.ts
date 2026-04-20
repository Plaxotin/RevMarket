import { describe, expect, it } from "vitest";
import {
  formatPhoneDisplay,
  handlePhoneInput,
  normalizePhone,
  validateRussianPhone,
} from "./phoneValidation";

describe("phoneValidation utilities", () => {
  describe("normalizePhone", () => {
    it("normalizes 8-prefixed numbers to +7", () => {
      expect(normalizePhone("8 (900) 123-45-67")).toBe("+79001234567");
    });

    it("normalizes 7-prefixed numbers without plus", () => {
      expect(normalizePhone("79001234567")).toBe("+79001234567");
    });

    it("normalizes already formatted +7 numbers", () => {
      expect(normalizePhone("+7 (900) 123-45-67")).toBe("+79001234567");
    });

    it("normalizes 10-digit mobile numbers starting with 9", () => {
      expect(normalizePhone("9001234567")).toBe("+79001234567");
    });

    it("returns null for empty or invalid numbers", () => {
      expect(normalizePhone("")).toBeNull();
      expect(normalizePhone("12345")).toBeNull();
      expect(normalizePhone("+7900123456")).toBeNull();
      expect(normalizePhone((null as unknown) as string)).toBeNull();
    });
  });

  describe("validateRussianPhone", () => {
    it("returns error when phone is empty", () => {
      expect(validateRussianPhone("")).toEqual({
        valid: false,
        error: "Введите номер телефона",
      });
    });

    it("returns error for invalid phone format", () => {
      expect(validateRussianPhone("12345")).toEqual({
        valid: false,
        error: "Некорректный формат номера. Используйте формат: +7 (XXX) XXX-XX-XX",
      });
    });

    it("rejects numbers with unsupported operator code", () => {
      expect(validateRussianPhone("+72001234567")).toEqual({
        valid: false,
        error: "Некорректный код оператора. Проверьте правильность номера",
        normalized: "+72001234567",
      });
    });

    it("accepts valid russian numbers and returns normalized output", () => {
      expect(validateRussianPhone("+79001234567")).toEqual({
        valid: true,
        normalized: "+79001234567",
      });
    });
  });

  describe("formatPhoneDisplay", () => {
    it("formats normalized numbers as +7 (XXX) XXX-XX-XX", () => {
      expect(formatPhoneDisplay("+79001234567")).toBe("+7 (900) 123-45-67");
    });

    it("returns original value when number cannot be normalized", () => {
      expect(formatPhoneDisplay("12345")).toBe("12345");
    });
  });

  describe("handlePhoneInput", () => {
    it("formats 8-prefixed input into display format", () => {
      expect(handlePhoneInput("8 (900) 123-45-67")).toBe("+7 (900) 123-45-67");
    });

    it("formats 10-digit mobile input starting with 9", () => {
      expect(handlePhoneInput("9001234567")).toBe("+7 (900) 123-45-67");
    });

    it("keeps properly formatted +7 input stable", () => {
      expect(handlePhoneInput("+7 (900) 123-45-67")).toBe("+7 (900) 123-45-67");
    });
  });
});

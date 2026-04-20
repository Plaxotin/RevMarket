import { describe, expect, it } from "vitest";
import { translateSupabaseError } from "./errorMessages";

describe("translateSupabaseError", () => {
  it("maps password minimum length errors", () => {
    expect(
      translateSupabaseError("Password should be at least 6 characters"),
    ).toBe("Пароль должен содержать минимум 6 символов");
  });

  it("maps invalid email errors", () => {
    expect(translateSupabaseError("Invalid email")).toBe(
      "Некорректный email адрес",
    );
  });

  it("prioritizes auth message before generic not-found mapping", () => {
    expect(translateSupabaseError("User not found")).toBe(
      "Пользователь не найден",
    );
  });

  it("maps sms/provider errors", () => {
    expect(translateSupabaseError("SMS provider failed")).toBe(
      "SMS временно недоступен",
    );
  });

  it("maps domain-specific daily limit errors", () => {
    expect(translateSupabaseError("request_daily_limit_exceeded")).toBe(
      "Превышен лимит новых объявлений на сегодня. Попробуйте завтра.",
    );
    expect(translateSupabaseError("offer_daily_limit_exceeded")).toBe(
      "Превышен лимит предложений на сегодня. Попробуйте завтра.",
    );
  });

  it("returns the original message when no mapping exists", () => {
    const message = "Some completely unknown error";
    expect(translateSupabaseError(message)).toBe(message);
  });
});

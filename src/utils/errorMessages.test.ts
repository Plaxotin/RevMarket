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

  it("handles mixed-case input by matching case-insensitively", () => {
    expect(translateSupabaseError("InVaLiD CrEdEnTiAlS")).toBe(
      "Неверный email или пароль",
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

  it("prioritizes explicit sms mapping over generic server mapping", () => {
    expect(translateSupabaseError("Server error: SMS provider unavailable")).toBe(
      "SMS временно недоступен",
    );
  });

  it("maps generic rate limit when no email-specific branch matches", () => {
    expect(translateSupabaseError("Too many requests: rate limit reached")).toBe(
      "Слишком много попыток. Подождите немного",
    );
  });

  it("maps unauthorized and forbidden status variants", () => {
    expect(translateSupabaseError("401 Unauthorized")).toBe(
      "Необходима авторизация",
    );
    expect(translateSupabaseError("Forbidden operation")).toBe("Доступ запрещен");
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

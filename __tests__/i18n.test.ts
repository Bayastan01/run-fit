/// <reference types="jest" />
import { t, setLocale, getLocale } from "../src/lib/i18n";

describe("i18n", () => {
  it("returns Russian by default", () => {
    setLocale("ru");
    expect(t("auth.login")).toBe("Войти");
    expect(t("wallet.title")).toBe("Кошелёк");
  });

  it("switches to English", () => {
    setLocale("en");
    expect(t("auth.login")).toBe("Sign in");
    expect(t("wallet.title")).toBe("Wallet");
  });

  it("getLocale reflects current", () => {
    setLocale("ru");
    expect(getLocale()).toBe("ru");
    setLocale("en");
    expect(getLocale()).toBe("en");
  });
});

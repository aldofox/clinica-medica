import { describe, expect, it } from "vitest";
import {
  isValidCpf,
  isValidCrm,
  isValidDateNotInFuture,
  isValidEmail,
  isValidPhone,
} from "./formValidation";

describe("formValidation", () => {
  it("accepts valid CPF values", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("11111111111")).toBe(false);
  });

  it("accepts valid e-mail and phone formats", () => {
    expect(isValidEmail("admin@clinica.com")).toBe(true);
    expect(isValidEmail("email-invalido")).toBe(false);
    expect(isValidPhone("(11) 99999-1234")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });

  it("validates CRM and date fields", () => {
    expect(isValidCrm("SP123456")).toBe(true);
    expect(isValidCrm("ABC")).toBe(false);

    const today = new Date();
    const past = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const future = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    expect(isValidDateNotInFuture(past.toISOString().slice(0, 10))).toBe(true);
    expect(isValidDateNotInFuture(future.toISOString().slice(0, 10))).toBe(false);
  });
});

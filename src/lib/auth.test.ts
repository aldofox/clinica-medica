import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, isLoggedIn, login, logout } from "./auth";
import * as apiClient from "./apiClient";

describe("auth session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores session and token when the admin logs in", async () => {
    vi.spyOn(apiClient.authApi, "login").mockResolvedValue({
      token: "token-123",
      user: {
        id: 1,
        email: "admin@clinica.com",
        nome: "Administrador",
        role: "admin",
      },
    });

    const session = await login("admin@clinica.com", "senha123");

    expect(session.email).toBe("admin@clinica.com");
    expect(session.role).toBe("admin");
    expect(apiClient.getToken()).toBe("token-123");
    expect(isLoggedIn()).toBe(true);
    expect(getSession()?.nome).toBe("Administrador");
  });

  it("invalidates expired sessions", async () => {
    const expiredSession = {
      email: "secretaria@clinica.com",
      nome: "Secretária",
      role: "secretaria",
      loggedAt: Date.now() - 9 * 60 * 60 * 1000,
    };

    sessionStorage.setItem("clinica_admin_session", JSON.stringify(expiredSession));
    sessionStorage.setItem("clinica_token", "token-expired");
    sessionStorage.setItem("clinica_token_expires_at", String(Date.now() + 60_000));

    expect(getSession()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  it("removes session data on logout", async () => {
    vi.spyOn(apiClient.authApi, "login").mockResolvedValue({
      token: "token-logout",
      user: {
        id: 2,
        email: "secretaria@clinica.com",
        nome: "Secretária",
        role: "secretaria",
      },
    });

    await login("secretaria@clinica.com", "senha123");
    logout();

    expect(apiClient.getToken()).toBeNull();
    expect(getSession()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});

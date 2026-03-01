import { api } from "./api";

export type AuthResponse = {
  token: string;
  email: string;
};

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken })
  });
}

export async function logout(): Promise<void> {
  await api<void>("/auth/logout", {
    method: "POST"
  });
}

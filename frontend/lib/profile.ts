import { api } from "./api";

export type MyProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function getMyProfile(): Promise<MyProfile> {
  return api<MyProfile>("/me");
}

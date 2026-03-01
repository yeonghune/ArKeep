const TOKEN_KEY = "arkeep_access_token";
const EMAIL_KEY = "arkeep_user_id";
const NAME_KEY = "arkeep_user_name";
const PICTURE_KEY = "arkeep_user_picture";
const SESSION_CHANGED_EVENT = "arkeep:session-changed";

export type Session = {
  token: string;
  email: string;
  name?: string;
  pictureUrl?: string;
};

export function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  const email = window.sessionStorage.getItem(EMAIL_KEY) || "";
  const name = window.sessionStorage.getItem(NAME_KEY) || undefined;
  const pictureUrl = window.sessionStorage.getItem(PICTURE_KEY) || undefined;
  if (!token) return null;
  return { token, email, name, pictureUrl };
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, session.token);
  window.sessionStorage.setItem(EMAIL_KEY, session.email);
  if (session.name) {
    window.sessionStorage.setItem(NAME_KEY, session.name);
  } else {
    window.sessionStorage.removeItem(NAME_KEY);
  }
  if (session.pictureUrl) {
    window.sessionStorage.setItem(PICTURE_KEY, session.pictureUrl);
  } else {
    window.sessionStorage.removeItem(PICTURE_KEY);
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(EMAIL_KEY);
  window.sessionStorage.removeItem(NAME_KEY);
  window.sessionStorage.removeItem(PICTURE_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function sessionChangedEventName(): string {
  return SESSION_CHANGED_EVENT;
}

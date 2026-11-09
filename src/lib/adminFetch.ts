"use client";

const TOKEN_KEY = "cdc_admin_token";

// Mémoire de secours : si le navigateur bloque le localStorage (aperçu
// intégré, navigation privée stricte…), le jeton reste au moins valable
// tant que l'onglet est ouvert.
let memoryToken = "";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  } catch {
    // stockage bloqué : on retombe sur la mémoire
  }
  return memoryToken;
}

export function setAdminToken(token: string) {
  memoryToken = token;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // stockage bloqué : la mémoire de secours prend le relais
  }
}

// Indique si le stockage persistant est disponible (sinon la connexion ne
// survivra pas à un rechargement complet de la page).
export function isStoragePersistent(): boolean {
  try {
    const k = "__cdc_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

// fetch qui ajoute automatiquement le code organisateur en en-tête.
// Fonctionne même si le navigateur bloque les cookies.
export async function adminFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("x-admin-code", token);
  }
  return fetch(url, { ...init, headers, credentials: "same-origin" });
}

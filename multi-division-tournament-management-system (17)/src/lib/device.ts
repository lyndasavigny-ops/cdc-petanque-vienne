"use client";

// Identifiant unique de l'appareil, mémorisé dans le navigateur.
// Sert à verrouiller le code de saisie sur l'appareil du club référent.
const KEY = "cdc_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id =
        "dev-" +
        Math.random().toString(36).slice(2, 10) +
        "-" +
        Date.now().toString(36);
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

import api from "./api";

// Lightweight client-side analytics. Fire-and-forget: failures are swallowed
// so analytics never interrupts the user experience.
export async function track(event, payload = {}) {
  try {
    await api.post("/analytics/event", { event, ...payload });
  } catch (error) {
    /* ignore */
  }
}

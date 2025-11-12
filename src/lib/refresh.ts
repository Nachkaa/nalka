// client-only helper to propagate state changes across pages/tabs
export function emitGlobalRefresh() {
  try {
    const ch = new BroadcastChannel("nalka:refresh");
    ch.postMessage({ t: Date.now() });
    ch.close();
  } catch {}
}

export function listenGlobalRefresh(cb: () => void) {
  try {
    const ch = new BroadcastChannel("nalka:refresh");
    ch.onmessage = () => cb();
    return () => ch.close();
  } catch {
    return () => {};
  }
}

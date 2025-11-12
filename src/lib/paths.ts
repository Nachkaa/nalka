// Centralise toutes les routes. Importe ces helpers partout.
export const paths = {
  home: () => "/",
  login: () => "/login",

  events: () => "/event",
  eventNew: () => "/event/new",
  event: (id: string) => `/event/${id}`,

  lists: () => "/lists",          // (si besoin)
  list: (id: string) => `/list/${id}`,

  profile: () => "/profile",
  settings: () => "/settings",
} as const;

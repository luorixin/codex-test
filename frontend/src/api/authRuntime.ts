type AuthRuntimeHandlers = {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<string | null>;
  logoutUnauthorized: () => Promise<void>;
};

let handlers: AuthRuntimeHandlers = {
  getAccessToken: () => null,
  refreshSession: async () => null,
  logoutUnauthorized: async () => {},
};

export function registerAuthRuntimeHandlers(nextHandlers: AuthRuntimeHandlers) {
  handlers = nextHandlers;
}

export function getAccessToken() {
  return handlers.getAccessToken();
}

export function refreshSession() {
  return handlers.refreshSession();
}

export function logoutUnauthorized() {
  return handlers.logoutUnauthorized();
}

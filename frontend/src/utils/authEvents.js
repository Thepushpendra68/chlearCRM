const forcedLogoutListeners = new Set();

export const subscribeForcedLogout = (listener) => {
  forcedLogoutListeners.add(listener);
  return () => forcedLogoutListeners.delete(listener);
};

export const emitForcedLogout = () => {
  forcedLogoutListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[AUTH] Forced logout listener failed:', error);
    }
  });
};

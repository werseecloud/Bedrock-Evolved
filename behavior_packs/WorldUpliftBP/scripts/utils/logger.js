import { world } from "@minecraft/server";
import { MutableConfig, setDebugEnabled } from "../config.js";

const PREFIX = "[WorldUplift]";

export const Logger = {
  setDebug(enabled) {
    setDebugEnabled(enabled);
  },

  getDebug() {
    return MutableConfig.DEBUG;
  },

  info(message) {
    console.warn(`${PREFIX} ${message}`);
  },

  warn(message) {
    console.warn(`${PREFIX} WARN ${message}`);
  },

  error(message, error) {
    const suffix = error ? ` ${error}` : "";
    console.warn(`${PREFIX} ERROR ${message}${suffix}`);
  },

  debug(message) {
    if (MutableConfig.DEBUG) {
      console.warn(`${PREFIX} DEBUG ${message}`);
    }
  },

  tell(target, message) {
    try {
      if (target && typeof target.sendMessage === "function") {
        target.sendMessage(`${PREFIX} ${message}`);
        return;
      }
      world.sendMessage(`${PREFIX} ${message}`);
    } catch (_error) {
      console.warn(`${PREFIX} ${message}`);
    }
  }
};

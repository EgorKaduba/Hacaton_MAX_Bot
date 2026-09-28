/**
 * Обёртка над MAX Bridge (window.WebApp).
 * Вне клиента MAX (обычный браузер при разработке) объект есть, но initData пустой —
 * поэтому все методы безопасны и деградируют до браузерных аналогов.
 */

const getWebApp = () => window.WebApp;

export const isInsideMax = () => Boolean(getWebApp()?.initData);

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[MAX Bridge]", e);
    return fallback;
  }
};

export const bridge = {
  get platform() {
    return getWebApp()?.platform ?? "web";
  },

  /** Платформа для MaxUI: он умеет только ios | android */
  get uiPlatform() {
    const p = this.platform;
    if (p === "android") return "android";
    if (p === "ios") return "ios";
    return /android/i.test(navigator.userAgent) ? "android" : "ios";
  },

  get user() {
    return getWebApp()?.initDataUnsafe?.user;
  },

  get initData() {
    return getWebApp()?.initData ?? "";
  },

  get startParam() {
    return getWebApp()?.initDataUnsafe?.start_param;
  },

  ready() {
    safe(() => getWebApp()?.ready?.());
  },

  backButton: {
    show: () => safe(() => getWebApp()?.BackButton.show()),
    hide: () => safe(() => getWebApp()?.BackButton.hide()),
    onClick: (cb) => safe(() => getWebApp()?.BackButton.onClick(cb)),
    offClick: (cb) => safe(() => getWebApp()?.BackButton.offClick(cb)),
  },

  haptic: {
    impact: (style = "light") =>
      isInsideMax() &&
      safe(() => getWebApp()?.HapticFeedback.impactOccurred(style)),
    notify: (type) =>
      isInsideMax() &&
      safe(() => getWebApp()?.HapticFeedback.notificationOccurred(type)),
    selection: () =>
      isInsideMax() &&
      safe(() => getWebApp()?.HapticFeedback.selectionChanged()),
  },

  closingConfirmation(enabled) {
    safe(() =>
      enabled
        ? getWebApp()?.enableClosingConfirmation()
        : getWebApp()?.disableClosingConfirmation(),
    );
  },

  openLink(url) {
    if (isInsideMax()) safe(() => getWebApp()?.openLink(url));
    else window.open(url, "_blank", "noopener");
  },

  async downloadFile(url, fileName) {
    if (isInsideMax()) {
      await getWebApp()?.downloadFile(url, fileName);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  },

  async share(text, link) {
    const webApp = getWebApp();
    if (isInsideMax() && webApp) {
      await webApp.shareMaxContent({ text, link });
      return;
    }
    if (navigator.share) await navigator.share({ text, url: link });
  },

  storage: {
    async get(key) {
      if (isInsideMax()) {
        try {
          const res = await getWebApp().DeviceStorage.getItem(key);
          if (res == null || typeof res === "string") return res;
          return res.value ?? null;
        } catch {
          /* desktop/web клиент MAX не поддерживает DeviceStorage */
        }
      }
      return localStorage.getItem(key);
    },
    async set(key, value) {
      if (isInsideMax()) {
        try {
          await getWebApp().DeviceStorage.setItem(key, value);
          return;
        } catch {
          /* fallback ниже */
        }
      }
      localStorage.setItem(key, value);
    },
    async remove(key) {
      if (isInsideMax()) {
        try {
          await getWebApp().DeviceStorage.removeItem(key);
        } catch {
          /* fallback ниже */
        }
      }
      localStorage.removeItem(key);
    },
  },
};

// @ts-nocheck
import "./alpine.js";

document.addEventListener("alpine:init", async () => {
  Alpine.store("app", {
    is_configured: false,
    config: null,
    currentPage: "loading",
    async init() {
      const { config } = await (await fetch("/api/app/config")).json();
      const { is_configured } = await (await fetch("/api/app/is_configured")).json();
      this.is_configured = is_configured;
      this.config = config;

      if (is_configured) {
        this.currentPage = "monitoring";
        return;
      }

      this.currentPage = "configuration";
    },
  });

  Alpine.data("configAppModal", () => ({
    async configurateApp() {
      console.log("Configuration app...");
    },
  }));
});

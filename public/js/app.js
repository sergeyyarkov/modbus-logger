// @ts-nocheck
import "./alpine.js";
import api from "./api.js";

document.addEventListener("alpine:init", async () => {
  Alpine.store("app", {
    is_configured: false,
    /**
     * Default configuration
     */
    config: {
      mb_connection_type: "TCP",
      mb_tcp_ip: "127.0.0.1",
      mb_tcp_port: 502,
      mb_rtu_path: "",
      mb_rtu_baud: 9600,
      mb_rtu_data_bits: 8,
      mb_rtu_stop_bits: 1,
      mb_rtu_parity: "even",
      log_interval_ms: 1000,
    },
    currentPage: "loading",
    async init() {
      const config = await fetch("/api/app/config");
      const is_configured = await fetch("/api/app/is_configured");

      if (config.ok && is_configured.ok) {
        this.config = (await config.json()).config;
        this.is_configured = (await is_configured.json()).is_configured;
      }

      if (this.is_configured) {
        this.currentPage = "monitoring";
        return;
      }

      this.currentPage = "configuration";
    },
  });

  Alpine.data("configApp", () => ({
    selectedConnectionType: "TCP",
    isLoading: false,
    async configurateApp() {
      try {
        const {
          mb_connection_type,
          mb_tcp_ip,
          mb_tcp_port,
          mb_rtu_path,
          mb_rtu_baud,
          mb_rtu_parity,
          mb_rtu_data_bits,
          mb_rtu_stop_bits,
          log_interval_ms,
        } = this.$store.app.config;

        if (mb_connection_type === "TCP") {
          await api.patch("/app/config", {
            mb_connection_type,
            mb_tcp_ip,
            mb_tcp_port,
            log_interval_ms,
          });

          await api.post("/modbus/connect");

          this.$store.app.currentPage = "monitoring";
          return;
        }

        if (mb_connection_type === "RTU") {
          await api.patch("/app/config", {
            mb_rtu_path,
            mb_rtu_parity,
            mb_rtu_data_bits,
            mb_rtu_stop_bits,
            mb_rtu_baud,
          });
          await api.post("/modbus_connect");
          this.$store.app.currentPage = "monitoring";
          return;
        }
      } catch (error) {
        console.error("Error while configuring app.");
      }
    },
  }));
});

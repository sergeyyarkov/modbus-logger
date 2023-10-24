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
      try {
        const { config } = await api.get("/app/config");
        const { is_configured } = await api.get("/app/is_configured");

        this.is_configured = is_configured;

        if (config) this.config = config;
        if (is_configured) {
          this.currentPage = "monitoring";
          return;
        }

        this.currentPage = "configuration";
      } catch (error) {
        throw new Error("Error on initializing app.");
      }
    },
  });

  Alpine.data("configApp", () => ({
    selectedConnectionType: "TCP",
    isLoading: false,
    errorMessage: "",
    async configurateApp() {
      this.isLoading = true;
      this.errorMessage = "";
      let data = {};
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
        data = {
          mb_connection_type,
          mb_tcp_ip,
          mb_tcp_port,
          log_interval_ms,
        };
      }

      if (mb_connection_type === "RTU") {
        data = {
          mb_connection_type,
          mb_rtu_path,
          mb_rtu_parity,
          mb_rtu_data_bits,
          mb_rtu_stop_bits,
          mb_rtu_baud,
          log_interval_ms,
        };
      }

      if (data) {
        await api.patch("/app/config", data);

        try {
          await api.post("/modbus/connect");
          this.$store.app.currentPage = "monitoring";
        } catch (error) {
          this.errorMessage = `Modbus connection error: ${error.message}`;
        }
      }

      this.isLoading = false;
    },
  }));
});

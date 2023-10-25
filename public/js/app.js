// @ts-nocheck
import "./alpine.js";
import api from "./api.js";
import * as utils from "./utils/index.js";

const pages = ["loading", "monitoring", "configuration", "404"];

var data = [];
var t = new Date();

for (var i = 10; i >= 0; i--) {
  var x = new Date(t.getTime() - i * 1000);
  data.push([x, Math.random()]);
}

document.addEventListener("DOMContentLoaded", () => {
  var g = new Dygraph(document.getElementById("div_g"), data, {
    drawPoints: false,
    showRoller: false,
    // valueRange: [0.0, 6.8],
    labels: ["Time", "Random"],
  });

  window.intervalId = setInterval(function () {
    var x = new Date(); // current time
    var y = Math.random();
    data.push([x, y]);
    g.updateOptions({ file: data });
  }, 1000);
});

document.addEventListener("alpine:init", async () => {
  Alpine.store("app", {
    is_configured: false,
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
    error: null,
    devices: [],
    async init() {
      try {
        const { config } = await api.get("/app/config");
        const { is_configured } = await api.get("/app/is_configured");

        this.is_configured = is_configured;

        if (config) this.config = config;
        if (is_configured) {
          const devices = await api.get("/modbus/devices");
          this.devices = devices;
          this.currentPage = "monitoring";
          return;
        }

        this.currentPage = "configuration";
      } catch (error) {
        this.currentPage = "error";
        this.error = error;
      }
    },

    setPage(page) {
      if (!pages.includes(page)) {
        this.currentPage = "404";
        return;
      }

      this.currentPage = page;
    },
  });

  Alpine.data("configAppPage", () => ({
    selectedConnectionType: "TCP",
    isLoading: false,
    errorMessage: "",
    async configurateApp() {
      try {
        this.isLoading = true;
        this.errorMessage = "";
        const data = { ...this.$store.app.config };
        const body = {
          RTU: utils.objKeysExclude(data, ["mb_tcp_ip", "mb_tcp_port"]),
          TCP: utils.objKeysExclude(data, [
            "mb_rtu_path",
            "mb_rtu_baud",
            "mb_rtu_parity",
            "mb_rtu_data_bits",
            "mb_rtu_stop_bits",
          ]),
        };
        await api.patch("/app/config", body[data.mb_connection_type]);
        await api.post("/modbus/connect");
        this.$store.app.currentPage = "monitoring";
      } catch (error) {
        this.errorMessage = `${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
  }));
});

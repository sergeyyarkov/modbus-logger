// @ts-nocheck
import "./alpine.js";
import api from "./api.js";
import * as utils from "./utils/index.js";

const pages = ["loading", "monitoring", "configuration", "404"];
let graphData = [[0, 0]];

document.addEventListener("alpine:init", async () => {
  Alpine.store("app", {
    is_configured: false,
    is_opened: false,
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
    async init() {
      try {
        const connStatusEventSource = new EventSource("/api/modbus/status");
        const { config } = await api.get("/app/config");
        const { is_configured } = await api.get("/app/is_configured");

        this.is_configured = is_configured;

        if (config) this.config = config;
        if (is_configured) {
          connStatusEventSource.onmessage = (e) => (this.is_opened = e.data === "true");
          await utils.wait(500);
          this.currentPage = "monitoring";
          return;
        }

        this.currentPage = "configuration";
      } catch (error) {
        console.error(error);
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

  Alpine.data("monitoringPage", () => ({
    selectedDevice: null,
    devices: [],
    async init() {
      try {
        this.$store.app.currentPage = "loading";
        var g = new Dygraph(document.getElementById("div_g"), graphData, {
          drawPoints: false,
          showRoller: false,
          ylabel: "Y Label",
          valueRange: [0.0, 1.8],
          // labels: ["Time", "Random"],
        });
        this.devices = await api.get("/modbus/devices");
        window.intervalId = setInterval(() => {
          graphData.push([new Date(), Math.random()]);
          g.updateOptions({ file: graphData });
        }, 500);
      } catch (error) {
        this.$store.app.error = error;
      } finally {
        this.$store.app.currentPage = "monitoring";
      }
    },
    selectDevice(device) {
      if (device.id === this.selectedDevice?.id) return;
      graphData = [];
      this.selectedDevice = device;
    },
    async removeDevice(id) {
      try {
        await api.post('/modbus/remove_device', { id });
        this.devices = this.devices.filter((d) => d.id != id);
        this.selectedDevice = null;
      } catch (error) {
        console.error("Error while removing device.", error);
      }
    },
  }));

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
        await utils.wait(500);
        this.$store.app.currentPage = "monitoring";
      } catch (error) {
        this.errorMessage = `${error.message}`;
      } finally {
        this.isLoading = false;
      }
    },
  }));

  Alpine.data("dialog", () => ({
    isOpen: false,
    isLoading: false,
    labels: {
      title: "Confirm dialog",
      body: "Are you sure you want to perform this action?",
    },
    cb: null,
    onConfirm: () => undefined,
    onError: () => undefined,
    confirm() {
      if (this.onConfirm.constructor.name === 'AsyncFunction') {
        this.isLoading = true;
        this.onConfirm()
          .then(() => this.close())
          .catch((e) => this.onError(e))
          .finally(() => this.isLoading = false)
      } else {
        this.onConfirm();
        this.close();
      }
    },
    close() {
      this.isOpen = false;
      this.cb = null;
    },
    open(event) {
      const { detail } = event;
      this.isOpen = detail.isOpen;
      this.onConfirm = detail.onConfirm;
      this.labels = { title: detail.title, body: detail.body };
    }
  }));
});

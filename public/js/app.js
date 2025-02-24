// @ts-nocheck
import "./alpine.js";
import api from "./api.js";
import * as utils from "./utils/index.js";

var pages = ["loading", "monitoring", "configuration", "404"];
var dataStreamSource;
var graphData = [];
var g = null;

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
    registersTypesMap: {
      'IR': 'Input Registers',
      'HR': 'Holding Registers',
      "DI": "Discrete Input",
      "DO": "Coils"
    },
    async init() {
      try {
        const connStatusEventSource = new EventSource("/api/modbus/status");
        const { config } = await api.get("/app/config");
        const { is_configured } = await api.get("/app/is_configured");

        this.is_configured = is_configured;
        connStatusEventSource.onmessage = (e) => (this.is_opened = e.data === "true");

        if (config) this.config = config;
        if (is_configured) {
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

  Alpine.data("deviceModal", () => ({
    isOpen: false,
    isLoading: false,
    error: null,
    graphView: "",
    data: {
      oldId: null,
      id: null,
      name: "",
      g_display_reg_addr: null,
      g_display_reg_format: "UI16",
      g_display_reg_type: "IR",
      g_y_label: "",
    },
    labels: {
      title: '',
      submit: '',
      cancel: ''
    },
    actionType: 'CREATE',
    resetDataFields() {
      this.data.id = null;
      this.data.name = "";
      this.data.g_display_reg_addr = null;
      this.data.g_display_reg_format = "UI16";
      this.g_display_reg_type = "IR";
      this.data.g_y_label = "";
    },
    async create(cb) {
      try {
        this.isLoading = true;
        this.error = null;
        await api.post("/modbus/create_device", utils.dellNullableKeys({ ...this.data }));
        this.$dispatch("add-device", { ...this.data, display_values: [] }); // add device to state
        this.close();
        cb && cb();
      } catch (error) {
        this.error = error;
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    async edit() {
      try {
        this.isLoading = true;
        this.error = null;
        if (this.graphView !== 'new-value') {
          this.data.g_display_reg_addr = null;
          this.data.g_display_reg_format = null;
          this.data.g_y_label = null;
          this.data.g_display_reg_type = null;
        }
        await api.post('/modbus/update_device', utils.dellNullableKeys({ ...this.data, id: this.data.oldId, newId: this.data.id }));
        window.location.reload();
      } catch (error) {
        this.error = error;
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    async submit() {
      switch (this.actionType) {
        case 'CREATE':
          await this.create()
          this.graphView = 'none'
          break;
        case 'EDIT':
          await this.edit()
          break;
        default:
          break;
      }
    },
    open(event) {
      const { detail } = event;
      this.labels = { 
        title: detail.labels.title, 
        body: detail.labels.body, 
        submit: detail.labels.submit, 
        cancel: detail.labels.cancel 
      };
      this.actionType = detail.actionType;
      if (detail.device) {
        this.data.oldId = detail.device.id;
        this.data.id = detail.device.id;
        this.data.name = detail.device.name;
        if (detail.device.g_display_reg_addr !== null) {
          this.graphView = 'new-value'
          this.data.g_display_reg_addr = detail.device.g_display_reg_addr;
          this.data.g_display_reg_format = detail.device.g_display_reg_format;
          this.data.g_display_reg_type = detail.device.g_display_reg_type;
          this.data.g_y_label = detail.device.g_y_label;
        }
      }
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
      this.resetDataFields();
      this.graphView = "";
    },
  }));

  Alpine.data('displayValueModal', () => ({
    isOpen: false,
    isLoading: false,
    error: null,
    data: {
      name: '',
      reg_addr: 0,
      reg_type: 'IR',
      reg_format: 'UI16'
    },
    labels: {
      title: '',
      submit: '',
    },
    selectedDevice: null,
    resetDataFields() {
      this.data.name = '';
      this.data.reg_addr = 0;
      this.data.reg_type = 'IR';
      this.data.reg_format = 'UI16';
    },
    async create() {
      this.isLoading = true;
      const data = { ...this.data, slave_id: this.selectedDevice.id };
      const result = await api.post('/modbus/create_display-value', data);
      this.selectedDevice?.display_values?.push(result.data);
      this.resetDataFields();
      this.close();
    },
    async update() {
      const data = { ...this.data, slave_id: this.selectedDevice.id };
      await api.post('/modbus/update_display-value', data);
      this.resetDataFields();
      this.close();
    },
    async submit() {
      try {
        this.isLoading = true;
        switch (this.actionType) {
          case 'CREATE':
            await this.create();
            break;
          case 'EDIT':
            await this.update();
            break;
          default:
            break;
        }
      } catch (error) {
        this.error = error;
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    open(event) {
      const { labels, actionType, selectedDevice, displayValue } = event.detail
      this.isOpen = true;
      this.labels = { title: labels.title, submit: labels.submit };
      this.actionType = actionType;
      this.selectedDevice = selectedDevice;
      if (displayValue) {
        this.data.id = displayValue.id;
        this.data.name = displayValue.name;
        this.data.reg_addr = displayValue.reg_addr;
        this.data.reg_format = displayValue.reg_format;
        this.data.reg_type = displayValue.reg_type;
      }
    },
    close() {
      this.isOpen = false;
      this.resetDataFields();
    },
  }))

  Alpine.data("monitoringPage", () => ({
    selectedDevice: null,
    devices: [],
    isLoading: false,
    error: null,
    resetGraph() {
      if (g instanceof Dygraph) {
        g.destroy();
        graphData = [];
        g = null;
      }
    },
    async init() {
      try {
        this.$store.app.currentPage = "loading";
        this.devices = await api.get("/modbus/devices");
      } catch (error) {
        this.$store.app.error = error;
      } finally {
        this.$store.app.currentPage = "monitoring";
      }
    },
    selectDevice(device) {
      if (device.id === this.selectedDevice?.id) return;

      this.error = null;
      this.selectedDevice = device;
      this.resetGraph();
      this.isLoading = true;

      dataStreamSource?.close();
      dataStreamSource = new EventSource(`/api/modbus/data_stream?slave_id=${device.id}`);
      dataStreamSource.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.error) {
          this.isLoading = false;
          this.error = data.error;
          console.error('[Modbus Error]:', data.error);
          return;
        }

        this.error = null;

        console.log("[SSE Message]", data);
        if (data.graph !== null) {
          this.selectedDevice.g_value = data.graph.value;
          graphData.push([new Date(), data.graph.value]);
          if (g === null) {
            g = new Dygraph(document.getElementById("div_g"), graphData, {
              drawPoints: false,
              showRoller: false,
              ylabel: device.g_y_label,
              rollPeriod: 5
            });
            g.resize(720, 300);
          }
          g.updateOptions({ file: graphData });
        }
        data.displayValues.forEach((v, i) => (this.selectedDevice.display_values[i] = v));
        this.isLoading = false;
      };
    },
    async removeDevice(id) {
      try {
        await api.post("/modbus/remove_device", { id });
        this.devices = this.devices.filter((d) => d.id != id);
        this.selectedDevice = null;
      } catch (error) {
        console.error("Error while removing device.", error);
      }
    },
    async removeDisplayValue(id) {
      try {
        await api.post("/modbus/remove_display-value", { id });
        this.selectedDevice.display_values = this.selectedDevice.display_values.filter((v) => v.id != id);
      } catch (error) {
        console.error("Error while removing display value", error);
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
    onConfirm: () => undefined,
    onError: () => undefined,
    confirm() {
      if (this.onConfirm.constructor.name === "AsyncFunction") {
        this.isLoading = true;
        this.onConfirm()
          .then(() => this.close())
          .catch((e) => this.onError(e))
          .finally(() => (this.isLoading = false));
      } else {
        this.onConfirm();
        this.close();
      }
    },
    close() {
      this.isOpen = false;
    },

    /**
     * Update dialog state on event
     * @param {CustomEvent} event
     */
    open(event) {
      const { detail } = event;
      this.isOpen = detail.isOpen;
      this.onConfirm = detail.onConfirm;
      this.labels = { title: detail.title, body: detail.body };
    }
  }));
});

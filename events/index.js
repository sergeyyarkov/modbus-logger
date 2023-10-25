import EventEmmiter from "events";

const globalEventEmmiter = new EventEmmiter();

/**
 * Start logging data from modbus slaves
 */
globalEventEmmiter.on("log:start", (pollInterval) => {});

globalEventEmmiter.on("log:stop", () => {});

export { globalEventEmmiter };

import EventEmmiter from "events";

const globalEventEmmiter = new EventEmmiter();

globalEventEmmiter.on("log:start", (pollInterval) => {});

globalEventEmmiter.on("log:stop", () => {});

export { globalEventEmmiter };

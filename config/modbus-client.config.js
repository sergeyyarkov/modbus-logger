import Modbus from "modbus-serial";

const modbusClient = new Modbus();

modbusClient.on("close", () => console.log("Modbus connection closed."));

export default modbusClient;

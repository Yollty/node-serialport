#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promirepl_1 = require("promirepl");
const repl_1 = __importDefault(require("repl"));
const serialport_1 = require("serialport");
// outputs the path to an arduino or nothing
async function findArduino() {
    const path = process.argv[2] || process.env.TEST_PORT;
    const baudRate = Number(process.argv[3] || process.env.BAUDRATE) || 9600;
    if (path && baudRate) {
        return { path, baudRate };
    }
    const ports = await serialport_1.SerialPort.list();
    for (const port of ports) {
        if (/arduino/i.test(port.manufacturer || '')) {
            return { path: port.path, baudRate };
        }
    }
    throw new Error('No arduinos found. You must specify a port to load.\n\nFor example:\n\tserialport-repl COM3\n\tserialport-repl /dev/tty.my-serialport');
}
findArduino()
    .then(({ path, baudRate }) => {
    console.log(`DEBUG=${process.env.DEBUG || ''} # enable debugging with DEBUG=serialport*`);
    console.log(`port = SerialPort({ path: "${path}", baudRate: ${baudRate}, autoOpen: false })`);
    console.log('globals { SerialPort, SerialPortMock, path, port }');
    const port = new serialport_1.SerialPort({ path, baudRate, autoOpen: false });
    const spRepl = repl_1.default.start({ prompt: '> ' });
    (0, promirepl_1.promirepl)(spRepl);
    spRepl.context.SerialPort = serialport_1.SerialPort;
    spRepl.context.SerialPortMock = serialport_1.SerialPortMock;
    spRepl.context.path = path;
    spRepl.context.port = port;
})
    .catch(e => {
    console.error(e.message);
    process.exit(1);
});

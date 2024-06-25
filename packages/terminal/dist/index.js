#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enquirer_1 = __importDefault(require("enquirer"));
const commander_1 = require("commander");
const stream_1 = require("@serialport/stream");
const output_translator_1 = require("./output-translator");
const bindings_cpp_1 = require("@serialport/bindings-cpp");
const { version } = require('../package.json');
const binding = (0, bindings_cpp_1.autoDetect)();
const makeNumber = (input) => Number(input);
commander_1.program
    .version(version)
    .usage('--list OR -p <port> -b <baud rate> [options...]')
    .description('A basic terminal interface for communicating over a serial port. Pressing ctrl+c exits.')
    .option('-l --list', 'List available ports then exit')
    .option('-p, --path <path>', 'Path of the serial port')
    .option('-b, --baud <baudrate>', 'Baud rate', makeNumber)
    .option('--databits <databits>', 'Data bits', makeNumber, 8)
    .option('--parity <parity>', 'Parity', 'none')
    .option('--stopbits <bits>', 'Stop bits', makeNumber, 1)
    .option('--no-echo', "Don't print characters as you type them.")
    .option('--flow-ctl <mode>', 'Enable flow control {XONOFF | RTSCTS}.')
    .parse(process.argv);
const args = commander_1.program.opts();
const listPorts = async () => {
    const ports = await binding.list();
    for (const port of ports) {
        console.log(`${port.path}\t${port.pnpId || ''}\t${port.manufacturer || ''}`);
    }
};
const askForPort = async () => {
    const ports = await binding.list();
    if (ports.length === 0) {
        console.error('No ports detected and none specified');
        process.exit(2);
    }
    // Error in Enquirer types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answer = await new enquirer_1.default.Select({
        name: 'serial-port-selection',
        message: 'Select a serial port to open',
        choices: ports.map((port, i) => ({
            message: `[${i + 1}] ${port.path}${port.pnpId ? ` - ${port.pnpId}` : ''}${port.manufacturer ? ` - ${port.manufacturer}` : ''}`,
            name: port.path,
        })),
        required: true,
    }).run();
    return answer;
};
const askForBaudRate = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baud = await new enquirer_1.default.NumberPrompt({
        name: 'baudRate-selection',
        message: 'Enter a baud rate',
        required: true,
        float: false,
        validate(input) {
            if (Number(input) <= 0) {
                return 'BaudRate must be a number greater than 0';
            }
            return true;
        },
    }).run();
    return baud;
};
const createPort = ({ path, baudRate }) => {
    console.log(`Opening serial port: ${path} echo: ${args.echo}`);
    const openOptions = {
        path,
        binding,
        baudRate,
        dataBits: args.databits,
        parity: args.parity,
        stopBits: args.stopbits,
        rtscts: args.flowCtl === 'CTSRTS',
        xon: args.flowCtl === 'XONOFF',
        xoff: args.flowCtl === 'XONOFF',
    };
    const port = new stream_1.SerialPortStream(openOptions);
    const output = new output_translator_1.OutputTranslator();
    output.pipe(process.stdout);
    port.pipe(output);
    port.on('error', (err) => {
        console.error('Error', err);
        process.exit(1);
    });
    port.on('close', (err) => {
        console.log('Closed', err);
        process.exit(err ? 1 : 0);
    });
    process.stdin.setRawMode(true);
    process.stdin.on('data', input => {
        for (const byte of input) {
            // ctrl+c
            if (byte === 0x03) {
                port.close();
                process.exit(0);
            }
        }
        port.write(input);
        if (args.echo) {
            output.write(input);
        }
    });
    process.stdin.resume();
    process.stdin.on('end', () => {
        port.close();
        process.exit(0);
    });
};
const run = async () => {
    if (args.list) {
        listPorts();
        return;
    }
    const path = args.path || (await askForPort());
    const baudRate = Number(args.baud || (await askForBaudRate()));
    await createPort({ path, baudRate });
};
run().catch(error => {
    console.error(error);
    process.exit(1);
});

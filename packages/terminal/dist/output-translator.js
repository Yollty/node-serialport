"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputTranslator = void 0;
const stream_1 = require("stream");
/**
 * Convert carriage returns to newlines for output
 */
class OutputTranslator extends stream_1.Transform {
    _transform(chunk, _encoding, cb) {
        for (let index = 0; index < chunk.length; index++) {
            const byte = chunk[index];
            if (byte === 0x0d) {
                chunk[index] = 0x0a;
            }
        }
        this.push(chunk);
        cb();
    }
}
exports.OutputTranslator = OutputTranslator;

/// <reference types="node" />
/// <reference types="node" />
import { Transform } from 'stream';
/**
 * Convert carriage returns to newlines for output
 */
export declare class OutputTranslator extends Transform {
    _transform(chunk: Buffer, _encoding: string, cb: () => void): void;
}

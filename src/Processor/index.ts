import { Readable } from 'stream';

export default interface Processor {
    process(stream: Readable): Promise<Array<Object>>;
    getStreamName(file: string): string;
    getLogGroup(file: string): string;
}

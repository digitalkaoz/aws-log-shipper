import { Readable } from 'stream';
import { basename, dirname } from 'path';
import { createInterface } from 'readline';
const parse = require('s3-access-log-parser');

import Processor from './index';

class S3 implements Processor {
    private records: Array<Object> = [];

    public process(stream: Readable): Promise<Array<Object>> {
        this.records = []; //urgz state

        const rl = createInterface({
            input: stream,
        });

        return new Promise((resolve, reject) => {
            rl.on('line', this.read.bind(this));
            rl.on('close', () =>
                resolve(
                    this.records.sort(
                        (a: any, b: any) => a.timestamp - b.timestamp,
                    ),
                ),
            );
        });
    }

    private read(line: string): void {
        const record = parse(line);

        this.records.push({
            timestamp: new Date(record['time']).getTime(),
            message: JSON.stringify(record),
        });
    }

    public getStreamName(key: string): string {
        //s3/2017-12-09-02-17-13-DE5BEE983CCAAD67 -> s3/2017-12-09
        const extractedName = basename(key)
            .split('-')
            .slice(0, 3)
            .join('-');
        const dirName = dirname(key)
            .split('/')
            .join('-');

        return `${dirName}/${extractedName}`;
    }

    public getLogGroup(): string {
        return process.env.S3_LOG_GROUP || 's3';
    }
}

export default S3;

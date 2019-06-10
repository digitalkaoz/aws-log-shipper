import { Readable } from 'stream';
import { createGunzip } from 'zlib';
import { basename, dirname } from 'path';
import { createInterface } from 'readline';
const parse = require('elb-log-parser');

import Processor from './index';

class Elb implements Processor {
    private records: Array<Object> = [];

    public process(stream: Readable): Promise<Array<Object>> {
        this.records = []; //urgz state

        const rl = createInterface({
            input: stream.pipe(createGunzip()),
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
            timestamp: new Date(record['timestamp']).getTime(),
            message: JSON.stringify(record),
        });
    }

    public getStreamName(key: string): string {
        //api/AWSLogs/229370416177/elasticloadbalancing/ap-southeast-2/2018/12/01/229370416177_elasticloadbalancing_ap-southeast-2_app.noted-api-prod.c7a793cfdf49a4ca_20181201T0000Z_13.236.212.223_pvjbod30.log.gz -> noted-api-prod/2018-12-01
        const dirName = dirname(key)
            .split('/')
            .reverse()
            .slice(0, 3)
            .reverse()
            .join('-');

        return dirName;
    }

    public getLogGroup(key: string): string {
        const extractedName = basename(key).split('.')[1];

        return process.env.ELB_LOG_GROUP || `/aws/elb/${extractedName}`;
    }
}

export default Elb;

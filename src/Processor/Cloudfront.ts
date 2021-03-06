import { Readable, Transform } from 'stream';
import { createGunzip } from 'zlib';
import { basename } from 'path';
//TODO import wont work?!
const CloudFrontParser = require('cloudfront-log-parser');

import Processor from './index';

type Record = {
    date: string;
    time: string;
}

class Cloudfront implements Processor {
    private parser: Transform;
    private records: Array<Object> = [];

    constructor() {
        this.parser = new CloudFrontParser({ format: 'web' });
    }

    public process(stream: Readable): Promise<Array<Object>> {
        this.records = []; //urgz state

        return new Promise((resolve, reject) => {
            this.parser.on('end', () =>
                resolve(
                    this.records.sort(
                        (a: any, b: any) => a.timestamp - b.timestamp,
                    ),
                ),
            );
            this.parser.on('error', reject);
            this.parser.on('readable', this.read.bind(this));

            stream.pipe(createGunzip()).pipe(this.parser);
        });
    }

    private read(): void {
        let record;
        while ((record = this.parser.read())) {
            this.records.push({
                timestamp: this.parseTime(record),
                message: JSON.stringify(record),
            });
        }
    }

    private parseTime(record:Record) : number {
        let date: Array<any> | null = `${record['date']} ${
            record['time']
        }`.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);

        if (!date) {
            return 0;
        }

        return Date.UTC(
            date[1],
            parseInt(date[2], 10) - 1,
            date[3],
            date[4],
            date[5],
            date[6],
        );
    }

    public getStreamName(key: string): string {
        //foo/bar/bazz/E20D7WQ5MJ98VF.2018-11-29-22.f6ea1037.gz -> 2018-11-29
        const extractedName = basename(key)
            .split('.')[1]
        return extractedName.substring(0, extractedName.lastIndexOf('-'));
    }

    public getLogGroup(key: string): string {
        const extractedName = basename(key).split('.')[0]

        return process.env.CF_LOG_GROUP || `/aws/cloudfront/${extractedName}`;
    }
}

export default Cloudfront;

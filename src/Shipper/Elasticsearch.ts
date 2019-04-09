import Shipper from './index';

import { Client, ConfigOptions } from 'elasticsearch';

const debug = require('debug')('Elasticsearch');

type Query = {
    body: Array<Object>;
};

type Record = {
    timestamp: number;
    message: string;
};
class Elasticsearch implements Shipper {
    private client: any;

    constructor(private logGroup: string) {
        const config: ConfigOptions = {
            host: <string>process.env.ELASTIC_ENDPOINT,
        };

        if (process.env.ELASTIC_AWS) {
            config.connectionClass = require('http-aws-es');
        }

        this.logGroup = this.formatIndex(logGroup);
        this.client = new Client(config);
    }

    async sendRecords(streamName: string, records: Record[]): Promise<any> {
        const query: Query = {
            body: [],
        };

        debug(
            `inserting "${records.length}" records into "${
                process.env.ELASTIC_ENDPOINT
            }"`,
        );

        records.forEach((record: Record) => {
            query.body.push({
                index: {
                    _index: `${this.logGroup}-${streamName.split('/')[1]}`,
                    _type: streamName.split('/')[0],
                },
            });

            //TODO typing?
            query.body.push({
                ...JSON.parse(record.message),
                '@timestamp': record.timestamp,
                timestamp: new Date(record.timestamp).toISOString()
            });
        });

        const result = await this.client.bulk(query);

        if (result.errors) {
            throw new Error(JSON.stringify(result.items));
        }

        return result;
    }

    private formatIndex(name: string):string {
        const newName = name.replace(/\//g, '-');

        if (
            newName.startsWith('-') ||
            newName.startsWith('_') ||
            newName.startsWith('+')
        ) {
            return newName.substr(1);
        }

        return newName;
    }
}

export default Elasticsearch;

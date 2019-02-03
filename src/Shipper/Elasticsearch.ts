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

    sendRecords(streamName: string, records: Record[]): Promise<any> {
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
                    _index: this.logGroup,
                    _type: streamName.split('/')[0],
                },
            });

            //TODO typing?
            query.body.push({
                '@timestamp': record.timestamp,
                ...JSON.parse(record.message),
            });
        });

        debug(records);

        return this.client.bulk(query);
    }

    private formatIndex(name: string) {
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

import Shipper from './index';

import { Client, ConfigOptions } from 'elasticsearch';

const debug = require('debug')('Elasticsearch');

type Query = {
    body: Array<Object>;
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

        this.client = new Client(config);
    }

    sendRecords(streamName: string, records: Object[]): Promise<any> {
        const query: Query = {
            body: [],
        };

        debug(
            `inserting "${records.length}" records into "${this.client.host}"`,
        );

        records.forEach((record: Object) => {
            query.body.push({
                index: { _index: this.logGroup, _type: streamName },
            });

            //TODO typing? timestamp?
            query.body.push(record);
        });

        return this.client.bulk(query);
    }
}

export default Elasticsearch;

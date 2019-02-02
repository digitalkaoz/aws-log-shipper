import Shipper from "./index"

import { Client } from "elasticsearch";

type Query = {
    body: Array<Object>
};

class Elasticsearch implements Shipper {
    private client:any;

    constructor(private logGroup: string) {
        this.client = new Client({ 
            host: process.env.ELASTIC_ENDPOINT,
            //log: 'trace'
         });
    }

    sendRecords(streamName: string, records: Object[]): Promise<any> {
        const query:Query = {
            body: []
        };

        records.forEach((record: Object) => {
            query.body.push({
                index:{ _index: this.logGroup, _type: streamName } 
            });

            //TODO typing? timestamp?
            query.body.push(record)
        });

        return this.client.bulk(query);        
    }
}

export default Elasticsearch;
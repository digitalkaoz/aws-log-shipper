import { Readable } from 'stream';

import Processor from './Processor/index';
import Cloudfront from './Processor/Cloudfront';
import Alb from './Processor/Alb';
import Elb from './Processor/Elb';
import S3 from './Processor/S3';

import Shipper from './Shipper/index';
import Cloudwatch from './Shipper/Cloudwatch';
import Elasticsearch from './Shipper/Elasticsearch';

class LogProcessor {
    public async process(stream: Readable, file: string) {
        const { logGroup, stream: logStream, records } = await this.readLogs(
            this.getProcessor(file),
            stream,
            file,
        );
        const shipper = this.getShipper(logGroup);

        return shipper.sendRecords(logStream, records);
    }

    private getShipper(logGroup:string): Shipper {

        switch (process.env.SHIPPER) {
            case "cloudwatch" : return new Cloudwatch(logGroup);
            case "elasticsearch" : return new Elasticsearch(logGroup);
        }

        throw new Error("env variable SHIPPER should be one of [cloudwatch|]")
    }

    private getProcessor(file: string): Processor {
        if (-1 != file.indexOf('.gz')) {
            if (-1 != file.indexOf('elasticloadbalancing')) {
                //TODO differentiate between ELB + ALB (you cant see it from the filename)
                return new Alb();
                //return new Elb();
            } else {
                return new Cloudfront();
            }
        } else {
            return new S3();
        }
    }

    private async readLogs(
        processor: Processor,
        stream: Readable,
        file: string,
    ) {
        const records = await processor.process(stream);

        return {
            logGroup: processor.getLogGroup(),
            stream: processor.getStreamName(file),
            records,
        };
    }
}

export default LogProcessor;

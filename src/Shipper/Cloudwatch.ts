import { CloudWatchLogs, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import {
    DescribeLogStreamsResponse,
    PutLogEventsResponse,
    LogStream,
} from 'aws-sdk/clients/cloudwatchlogs';

import Shipper from './index';

const debug = require('debug')('Cloudwatch');

class Cloudwatch implements Shipper {
    private cloudwatch: CloudWatchLogs;

    constructor(private logGroup: string) {
        this.cloudwatch = new CloudWatchLogs({ apiVersion: '2015-01-28' });
    }

    async sendRecords(
        streamName: string,
        records: Array<Object>,
    ): Promise<any> {
        const response = await this.prepareCw(streamName);

        if (!response || !response.logStreams || !response.logStreams.length) {
            throw new Error('desired logstream not found');
        }

        const logStream = <LogStream>response.logStreams[0];

        debug(
            `inserting ${records.length} records into ${this.logGroup}/${
                logStream.logStreamName
            }`,
        );

        let sequence = logStream.uploadSequenceToken;
        for (let i = 0; i < records.length; i += 10000) {
            const response: PutLogEventsResponse = await this.cloudwatch
                .putLogEvents({
                    logStreamName: logStream.logStreamName,
                    logGroupName: this.logGroup,
                    logEvents: records,
                    sequenceToken: sequence,
                })
                .promise();

            sequence = response.nextSequenceToken;
        }
    }

    private async prepareCw(
        streamName: string,
    ): Promise<PromiseResult<DescribeLogStreamsResponse, AWSError>> {
        await this.createLogGroup();
        await this.createLogStream(streamName);

        return this.cloudwatch
            .describeLogStreams({
                logGroupName: this.logGroup,
                logStreamNamePrefix: streamName,
                limit: 1,
            })
            .promise();
    }

    private async createLogStream(streamName: string): Promise<void> {
        try {
            await this.cloudwatch
                .createLogStream({
                    logGroupName: this.logGroup,
                    logStreamName: streamName,
                })
                .promise();
        } catch (e) {}
    }

    private async createLogGroup(): Promise<void> {
        try {
            await this.cloudwatch
                .createLogGroup({
                    logGroupName: this.logGroup,
                    //kmsKeyId:
                })
                .promise();
        } catch (e) {}
    }
}

export default Cloudwatch;

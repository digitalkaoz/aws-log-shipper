import { S3 } from 'aws-sdk';
import { S3Event } from 'aws-lambda';
import { Readable } from 'stream';

const debug = require('debug')('Request');

export default class Request {
    private s3: S3;

    constructor(private event: S3Event) {
        this.s3 = new S3({
            //options?
        });
    }

    public getFileStream(): Readable {
        debug(
            `loading file "${this.getFile()}" from bucket "${this.getBucket()}"`,
        );

        return this.s3
            .getObject({
                Bucket: this.getBucket(),
                Key: this.getFile(),
            })
            .createReadStream();
    }

    public deleteFile() {
        console.log(S3.prototype
            .deleteObject);
        return this.s3
            .deleteObject({
                Bucket: this.getBucket(),
                Key: this.getFile(),
            })
            .promise();
    }

    public getFile(): string {
        return this.event.Records[0].s3.object.key;
    }

    private getBucket(): string {
        return this.event.Records[0].s3.bucket.name;
    }
}

import { S3Event, Context, Callback } from 'aws-lambda';

import Request from './Request';
import LogProcessor from './LogProcessor';

const handler = async (
    event: S3Event,
    context: Context,
    callback?: Callback,
) => {
    const request = new Request(event);
    const processor = new LogProcessor();

    try {
        const stream = request.getFileStream();

        await processor.process(stream, request.getFile());
        await request.deleteFile();
        callback
            ? callback(null, `shipped ${request.getFile()}`)
            : context.succeed(`shipped ${request.getFile()}`);
    } catch (error) {
        callback ? callback(error) : context.fail(error);
    }
};

export default handler;

// local debug invocation
if (process.env.NODE_ENV !== 'production') {
    const fs = require('fs');
    handler(
        JSON.parse(
            fs
                .readFileSync(__dirname + '/../tests/fixtures/event_cf.json')
                .toString(),
        ),
        <Context>{ fail: console.error, succeed: console.info },
        console.log,
    );
}

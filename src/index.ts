import { S3Event, Context, Callback } from 'aws-lambda';

import Request from './Request';
import LogProcessor from './LogProcessor';

const debug = require('debug')('handler');

const handler = async (
    event: S3Event,
    context: Context,
    callback?: Callback,
) => {
    const request = new Request(event);
    const processor = new LogProcessor();

    try {
        const stream = request.getFileStream();

        const processResult = await processor.process(stream, request.getFile());
        debug(processResult);

        const deleteResult = await request.deleteFile();
        debug(deleteResult);

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

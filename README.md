# aws-log-shipper

This module lets you ship AWS Logs from services that are only able to store them in an S3 Bucket (pretty useless) to other Services (e.g. Cloudwatch).
It ships the Data as JSON encoded String (so easy for every System afterwards)

## Installation

```
yarn add aws-log-shipper
```

## Usage

```js
const logShipper = require("aws-log-shipper");

module.exports.handler = logShipper.default;
```

Then configure your Lambda to use `index.handler` as handler endpoint.
You should invoke this Lambda with `s3:PutEvent` Bucket Notification of those Logfiles.

## Implementations

currently we can ship logs from the following services:

* Cloudfront
* ALB
* ELB (not yet, its hard to differntiate from ALB logs just by looking at file itself)
* S3

## Configuration

we configure the Lambda with `ENV` vars completely

* `SHIPPER` : where to ship the logs (atm the only option is `cloudwatch`)
* `CF_LOG_GROUP` : which Cloudwatch Loggroup to use for Cloudfront logs
* `ALB_LOG_GROUP` : which Cloudwatch Loggroup to use for ALB logs
* `ELB_LOG_GROUP` : which Cloudwatch Loggroup to use for ELB logs
* `S3_LOG_GROUP` : which Cloudwatch Loggroup to use for S3 logs

## TODO

this was just a quick evening hack, so most things are a bit rough

* Tests
* Docs
* decouple the ENV vars a bit (to tied to Cloudwatch Shipper)
* differentiate between ELB and ALB logs
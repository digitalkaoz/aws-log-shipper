export default interface Shipper {
    sendRecords(streamName: string, records: Array<Object>): Promise<any>;
}

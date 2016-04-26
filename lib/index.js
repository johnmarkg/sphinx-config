'use strict'

const processData = require('./process-data');

module.exports = function (config) {

    const query = require('./index/query')(config)
    const fields = require('./fields')(config)
    const mappedData = require('./index/mapped').mapped(fields.fields)
    const transform = require('./index/transform').transform(fields.fields, [
        processData])
    const combinedFields = require('./index/combined').combined(fields.fields)
    const castTypes = require('./index/types').cast(fields.fields)
    const defaults = require('./index/types').defaults(fields.fields)

    const shard = require('./shard')(config.shardFn, config.shardBy, config.shards)
    // const shard = require('./shard')(config.shardBy, config.shards)


    return {
        query: function (data) {
            data = data
                .map(mappedData)
                .map(transform)
                .map(castTypes)
                .map(combinedFields)
                .map(defaults)
                .map(fields.checkAllowedFields)
                // .map(shard)

            return query(data)
            // return data
        }
    }

}

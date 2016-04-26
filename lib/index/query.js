'use strict'

const squel = require('squel')
const debug = require('debug')('sphinx:indexer:query')

module.exports = function (config) {
    return function(data){

        if(!data.rows){
            let temp = data
            data = {}
            data.rows = temp
        }

        if(!data.index){
            data.index = config.index
        }

        debug(data)

        var q = squel
            .insert()
            .into(data.index)
            .setFieldsRows(data.rows);

        var query = q.toString().replace(/insert[\w\W]+?into/mi, 'REPLACE INTO')

        // empty mvas
        query = query.replace(/\'mva\(emptymva\)mva\'/g, "()")
        query = query.replace(/\'mva\(/g, "(")
        query = query.replace(/\)mva\'/g, ")")

        // status is a reserverd word, quote it
        query = query.replace(/\bstatus([,\)])/, "`status`$1");

        return query
    }

}

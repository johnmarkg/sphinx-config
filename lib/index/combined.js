'use strict'

const debug = require('debug')('sphinx:index:combined')

exports.combined = function(fields){
    return function(d){

        Object.keys(fields).forEach(function (f) {

            let _config = fields[f]

            if(_config.combined){
                if(typeof _config.combined == 'string'){
                    _config.combined = _config.combined.split(',')
                }
                debug('field: ' + _config.combined)
                d[f] = _config.combined.map(function(cField){
                    return d[cField]
                }).join("\n")
            }
        })

        return d

    }
}

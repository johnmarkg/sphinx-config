'use strict'
const debug = require('debug')('sphinx:index:mapped')

exports.mapped = function(fields){

    return function (d) {

        Object.keys(fields).forEach(function (f) {
            // let _config = fields[f]
            if(fields[f] && fields[f].src){
                d[f] = d[fields[f].src]
            }
        })

        return d
    }

 }

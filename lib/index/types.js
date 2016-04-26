'use strict'
// exports.typeCheck = typeCheck

// const defaultText = '__empty__'
const defaultText = ''
const mvaConst = 'mva'
const debug = require('debug')('sphinx:indexer:types')


exports.defaults = function (fields) {

    return function (d) {
        if(!d){ return d }
        Object.keys(fields).forEach(function (f) {
            debug('defaults field: ' + f)
            d[f] = defaults(fields[f], d[f])
        })

        return d
    }
}
exports.cast = function (fields) {

    return function (d) {
        if(!d){ return d }
        Object.keys(fields).forEach(function (f) {
            debug('cast field: ' + f)
            d[f] = typeCheck(fields[f], d[f])
        })

        return d
    }
}

function typeCheck(config, val) {
    debug(config)
    switch (config.type) {
        case 'rt_field':
            val = typeField(config, val)
            break;
        case 'rt_attr_uint':
            val = typeInt(val)
            break;
        case 'rt_attr_bigint':
            val = typeInt(val)
            break;
        case 'rt_attr_timestamp':
            val = typeInt(val)
            break;
        case 'rt_attr_string':
            val = typeMvaString(val)
            break;
        case 'rt_attr_multi':
            val = typeMvaInt(val)
            break;
        case 'rt_attr_json':
            val = typeJson(config, val)
            break;
    }

    return val
}

function typeField(config, val) {
    debug('typeField: ' + val)
    // if (!val && config.default) {
    //     val = config.default
    // }
    // else if(!val){
    //     val = defaultText
    // }
    if(!val){
        val = ''
    }
    else if(typeof val.join == 'function'){
        val =  '<p>' + val.join('</p><p>') + '</p>'
    }

    if(typeof val != 'string'){
        console.error(config)
        console.error(val)
        throw new Error('should be a string')
    }

    return val.replace(/\'/g , "\\'")
}

function typeMvaInt(val){
    if(val && typeof val.join == 'function'){
        val = val.map(typeInt)
    }
    else{
        val = typeInt(val)
    }

    if(!val){
        val = mvaConst + '()' + mvaConst
    }
    else if(typeof val.join != 'function'){
        val = mvaConst + '(' + val + ')' + mvaConst
    }
    else{
        val = mvaConst + '(' + val.join(',') + ')' + mvaConst
    }

    return val
}

function typeMvaString(val){
    if(val && typeof val.join == 'function'){
        val = val.map(typeString)
    }
    else{
        val = typeString(val)
    }

    if(!val){
        val = ''
    }
    else if(typeof val.join == 'function'){
        val = val.join("','")
    }

    // debug(val)
    return mvaConst + "('" + val + "')" + mvaConst
}

function typeString(val){
    if (typeof val == 'undefined') {
        val = ''
    }

    if(typeof val != 'string'){
        // console.error(config)
        console.error(val)
        throw new Error('should be a string')
    }
    return val
}

function typeJson(config, val){
    if(!val){ val = {} }
    else if(typeof val != 'object'){
        console.error(config)
        console.error(val)
        throw new Error('should be an object')
    }
    return JSON.stringify(val)
}

function typeInt(val) {
    // debug('typeInt: ' + val)
    // debug(parseInt(val, 10))
    return parseInt(val, 10)
}

function defaults(config,val){
    if(val){ return val; }

    switch (config.type) {

        case 'rt_field':
            val = config.default || defaultText
            break;

        case 'rt_attr_uint':
            if(isNaN(val)){
                val = 0
            }
            break;

        case 'rt_attr_bigint':
            if(isNaN(val)){
                val = 0
            }
            break;

        case 'rt_attr_string':
            val = ''
            break;

        case 'rt_attr_multi':
            val = mvaConst + '()' + mvaConst
            break;

        case 'rt_attr_json':
            val = '{}'
            break;
    }

    return val
}

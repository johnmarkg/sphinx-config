'use strict'
var debug = require('debug')('indexer:shard');
var _ = require('underscore');


function shardById(input,shardCount){
    return input % shardCount;
}

function shardByModulus(int, shards){
    if(!int){ return 0; }
    return int % shards
}

function shardByInteger(input){
    if(!input){ return 0; }

    var lastDigit = input.replace(/^.*(\d)([a-z_][a-z_0-9]?)$/i,"$1");
    if(lastDigit == input){
    	lastDigit = input.replace(/^.*(\d)$/i,"$1");
    }

    if(isNaN(lastDigit)){
        lastDigit = 0;
    }

    return lastDigit;
}

function shardByPatentNumber(input){
    if(!input){ return 0; }

    var lastDigit = input.replace(/^.*(\d)([a-z_][a-z_0-9]?)$/i,"$1");
    if(lastDigit == input){
    	lastDigit = input.replace(/^.*(\d)$/i,"$1");
    }

    if(isNaN(lastDigit)){
        lastDigit = 0;
    }

    return lastDigit;
}

// exports.shardById = shardById;
// exports.shardByPatentNumber = shardByPatentNumber

var shardFns = {
    id: shardById,
    patentNumber: shardByPatentNumber
};

var shardFn;
var tableBaseName

module.exports = function(_tableBaseName, shardBy, shardCount){

    debug(arguments)

    tableBaseName = tableBaseName
    // var _fn = eval(fn)
    if(!shardBy){
        shardFn = function(d){
            return d
        }
        return shardData
    }

    let _fn = shardFns[shardBy]
    shardFn = function(d){
        debug(d)
        debug('shard,' + d[shardBy] + ': ' + _fn(d[shardBy], shardCount))
        return _fn(d[shardBy], shardCount)
    }
    return shardData;
}

function shardData(data){
    debug('shardData')
    var shards = [];

    if(!_.isArray(data)){
        return shardFn(data)
    }

    _.each(data,function(d){


        var _shard = shardFn(d);
        if(!shards[_shard]){
            shards[_shard] = {index: tableBaseName + _shard, rows:[]};
        }
        shards[_shard].rows.push(d);
    });
    return shards;
}

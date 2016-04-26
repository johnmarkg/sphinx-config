'use strict'

const debug = require('debug')('sphinx:search')
const squel = require('squel')//.useFlavour('mysql')


module.exports = function(config){
    return {
        query: function(data){
            return query(config, data)
        }
    }
}


function query(config, data){
    // debug(data)
    let p = []
    let q = squel
        .select()
        .from(config.index)
        .field(data.select || '*')


    // let rtFields = []
    let text = []
    let attributes = []
    let operatorFn = 'or'
    let operator = 'or'
    //
    // q._where = q.where
    //
    // q.where = function(field, val){
    //     debug('where')
    //     debug(arguments)
    //     if(!config.fields[field] || !config.fields[field].type){
    //         throw new Error('unknown field: ' + field)
    //     }
    //     if(config.fields[field].type == 'rt_field'){
    //         text.push({
    //             field: field,
    //             query: val
    //         })
    //     }
    // }
    //
    // q.compile = function(){
    //     debug('compile')
    //     debug(text)
    //     debug(attributes)
    //
    //     let where = squel.expr()
    //     if(text.length > 0){
    //         // where[operatorFn]("MATCH(?)", rtFields(text))
    //         q._where("MATCH(?)", rtFields(text))
    //     }
    //
    //
    //     // q._where(where)
    //     return {
    //         // sql: q.toString() + ' ' + whereSections.join(' AND '),
    //         sql: q.toParam().text,
    //         vals: q.toParam().values
    //     }
    //
    // }
    //
    //
    // return q




    // let attributes = []
    let whereSections = []

    let where = squel.expr()



    // debug(config.fields)
    Object.keys(data).forEach(function(d){
        debug('-----')
        debug(d)
        debug(data[d])
        debug(config.fields[d])

        if(!config.fields[d]){
            return
        }
        if(config.fields[d].type == 'rt_field'){
            text.push('@' + d + ' ' + data[d])
            // text.push(rtField(d, data[d]))
            // text.push(d)
        }
        else{
            if(typeof data[d] != 'object'){
                // attributes.push(d + '= ?', )
                attributes.push(squel.expr().and(d + '= ?', data[d]))
            }
            else if(config.fields[d].type == 'rt_attr_string'){
                Object.keys(data[d]).forEach(function(_d){

                    if(_d == 'in'){
                        // attributes.push(squel.expr().and(d + " in ('" + data[d][_d].join("','") + "')" ))
                        where[operator](d + ' IN ?', data[d][_d])

                    }

                })
            }

            else{
                Object.keys(data[d]).forEach(function(_d){
                    if(_d.match(/[\<\>]/)){
                        // attributes.push(squel.expr().and(d + ' ' + _d +' ?', data[d][_d]))
                        where[operator](d + ' ' + _d + '?', data[d][_d])
                    }
                    else if(_d == 'in'){
                        // attributes.push(squel.expr().and(d + ' in (' + data[d][_d].join(',') + ')' ))
                        where[operator](d + ' IN ?', data[d][_d])
                    }

                })
            }
        }

    })

    debug(text)
    // debug(attributes)


    if(text.length > 0){
        where[operator]("MATCH(?)", text.join(' & '))
        // where[operator]("MATCH(?)", rtFields(text))
    }

    // attributes.forEach(function(a){
    //     // debug(a.toString())
    //     debug(a.toParam())
    //     whereSections.push(a.toParam().text)
    //     p = p.concat(a.toParam().values)
    //     q.where(a.toParam().text, a.toParam().values)
    // })

    // debug(whereSections)
    //
    // q.where(whereSections.join(' AND '))

    q.where(where)



    debug(q.toParam())



    return {
        // sql: q.toString() + ' ' + whereSections.join(' AND '),
        sql: q.toParam().text,
        vals: q.toParam().values
    }

}

function rtFields(textFields){
    debug('rtFields')
    debug(arguments)

    let text = [];
    textFields.forEach(function(d){
debug(d)
        // text.push('@' + d.field + ' ' + d.query.val)
        text.push(d)
    })

    return text
}

function rtField(field, query){

    return '@' + field + ' ' + query

}

function where(){

}

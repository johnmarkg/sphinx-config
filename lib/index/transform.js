'use strict'

const debug = require('debug')('sphinx:index:transform')

let transforms = {

}

exports.setTransform = function(name, fn){
    transforms[name] = fn
}

exports.transform = function(fields, transformModules){

     return function(d){

         Object.keys(fields).forEach(function (f) {
             debug('field: ' + f)

             let config = fields[f]
             debug(config)

             let val = d[f]
             if(!val){ return }



             if(config.extractField){
                 let extractFields = config.extractField.split(',')
                 debug('extractField: ' + config.extractField)
                 if(typeof val.map == 'function'){
                     d[f]  = val.map(function(d){
                        //  return d[config.extractField];

                         return extractFields.map(function(_f){
                             return d[_f]
                         }).join()
                     })

                     debug('extractField, ' + config.extractField + ': ' + d[f])
                 }
             }

             let fnName = config.indexFn || config.transform

             if(fnName){
                 debug('fn: ' + fnName)
                 let transformed = false
                 if(transformModules){
                     transformModules.forEach(function(m){
                         if(typeof m[fnName] == 'function'){
                             d[f] = m[fnName].call(m, val)
                             transformed = true
                         }
                     })
                 }

                 if(!transformed){
                     try{

                         d[f] = transforms[fnName].call(this, val)
                     }
                     catch(err){
                         throw err
                     }
                 }
             }

         })
         return d



     }
 }

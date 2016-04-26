'use strict'

const config = require('env-config-shared').get('sphinx').sphinx

const indexer = require('./lib/index')(config)
const search = require('./lib/search')(config)

// let data = [{
//     patent_number: 'US22343242',
//     number: 22343242,
//     intField: 4,id: 123,
//
//     country: 'US',
//     random: 'random',
//     patentNumber: 'Us22343242',
//     applicationNumber: 'app',
//
//     mvaInt: [3,6,9],
//     mvaInt2: null,
//     mvaInt3: '1',
//     mvaInt4: 'string',
//
//     mvaString: 'string',
//     mvaString2: ['a', 'b'],
//
//     ts: 123351
//
//
// }]
//
// console.info(indexer.query(data))

let query = {

    select: 'id',
    patentNumber: '345*',
    // patentNumber: {
    //     operator: 'NOT',
    //     query: '345*'
    // },

    applicationNumber: '"43225"',
    // applicationNumber: {
    //     query: '"43225"',
    //     operator: 'AND'
    // },
    mvaString: {
        'in': ['US', 'EP']
    },
    intField: {
        '<': 12,
        '>': 2,
    }
}
console.info(search.query(query))


// query.select('id, number')
// query.where()

// let query = search.query({
//     select: 'id'
// })
//
// query.where('patentNumber', {val: '1234'})
// console.info(query.compile())

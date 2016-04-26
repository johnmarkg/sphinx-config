'use strict'

module.exports = function(config){
    return {
        
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

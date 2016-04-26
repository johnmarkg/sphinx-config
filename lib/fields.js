'use strict'


module.exports = function (config) {

	let fields = whitelist(config.fields)

	return {
		fields: fields,
		checkAllowedFields: checkAllowedFields(fields)
	}

}


function whitelist(fields){
	let whitelist = {}
	Object.keys(fields).forEach(function (field) {

		// console.info(field)

		if (fields[field].whitelist) {
			whitelist[field] = true
		}
		if (fields[field].blacklist) {
			delete fields.fields[field]
		}
	})
	// console.info(whitelist)
	if (Object.keys(whitelist).length > 0) {
		Object.keys(fields).forEach(function (field) {
			if (!whitelist[field]) {
				delete fields[field]
			}
		})
	}
	return fields
}


function checkAllowedFields(fields) {

	return function (_obj) {
		Object.keys(_obj).forEach(function (key) {
			if (!fields[key] || !fields[key].type) {
				delete _obj[key];
			}
		})
		return _obj;
	}
}

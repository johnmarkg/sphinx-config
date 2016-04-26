'use strict'
var debug = require('debug')('indexer:process-data');
var _ = require('underscore');
var moment = require('moment');


// const flatten = require('array-flatten')
const unique = require('array-unique')

exports.splitQuery = function(query, _data, queue){
	if( _data.rows.length > 1 && Buffer.byteLength(query, 'utf8') > 3355000){
		debug('this query is to big, split it up')
		debug("query size: " + Buffer.byteLength(query, 'utf8'));
		_.each(_data.rows,function(row){
			queue.push({rows: [row], index: _data.index});
		});

		return true
	}
	return false;
}

function processNotes(data){
	return _.map(data,function(_obj){
		if(!_obj.notes){ return _obj; }

		var notes = {};
		// console.info('processNotes')
		// console.info(_obj);
		// console.info(_obj.notes);
		_.each(_obj.notes, function(n){
			// console.info(n)
			var key = (n.group_id || 0) + ':' + (n.collection_id || 0)
			notes[key] = n.note
			// notes[key] = 1
			// notes.push
		})

		if(!_obj.json){ _obj.json = {}; }
		_obj.json.notes = notes;
		delete _obj.notes
		// console.info(_obj.json);
		return _obj;
	});
}

function cpcs(obj){
	if(!obj.cpcs){ return obj }

	obj.cpcs = obj.cpcs.map(function(d){
		return d.cpc
	}).join("\n")
	return obj
}
function ipcs(obj){
	if(!obj.ipcs){ return obj }

	if(typeof obj.ipcs != 'function'){
		return obj
	}

	obj.ipcs = obj.ipcs.map(function(item){
		return item.ipc;
	}).join("\n")

	return obj
}
function usClasses(obj){
	if(!obj.us_classes){ return obj }

	if(typeof obj.us_classes != 'function'){
		return obj
	}

	obj.us_classes = obj.us_classes.map(function(item){
		return item;
	}).join("\n")

	if(obj.us_classes_current){
		obj.us_classes_current_main = obj.us_classes_current.map(function(item){
			return item.us_class;
		}).join("\n")
	}

	return obj
}

function claims(obj){
	if(!obj.claims){ return obj }

	var claimsInd = [];
	var claimsDep = [];

	if(obj.claims && obj.claims.data){
		obj.claims = obj.claims.data;
	}

	obj.claims = obj.claims.map(function(cl){
		if(!cl.claim){ return ''; }
		// debug('cl.referenced_claim: ' + cl.referenced_claim)
		var claimText = cl.claim.join("\n")
		if(cl.referenced_claim > 0){
			claimsDep.push(claimText);
		}
		else{
			claimsInd.push(claimText);
		}
		return claimText;
	})

	obj.claims_independent_count = 0
	obj.claims_dependent_count = 0
	obj.claims_count = 0

	obj.claims_independent = null
	obj.claims_dependent = null


	if(claimsInd.length){
		obj.claims_independent_count = claimsInd.length
		obj.claims_independent ='<p>' + claimsInd.join("</p>\n<p>") + '</p>';
	}
	if(claimsDep.length){
		obj.claims_dependent_count = claimsDep.length
		obj.claims_dependent ='<p>' + claimsDep.join("</p>\n<p>") + '</p>';
	}
	if(obj.claims.length){
		obj.claims_count = obj.claims.length
		obj.claims ='<p>' + obj.claims.join("</p>\n<p>") + '</p>';
	}
	else{
		obj.claims = null
	}

	return obj
}


exports.flattenClaims = function(claims){
	if(claims && claims.data){
		claims = claims.data;
	}

	claims = claims.map(function(cl){
		if(!cl.claim){ return ''; }
		return cl.claim.join("\n")
	})
	// debug(claims)
	if(claims.length){
		claims ='<p>' + claims.join("</p>\n<p>") + '</p>';
	}
	else{
		claims = null
	}
	return claims
}

exports.flattenClaimsIndependent = function(claims){
	return flattenClaims(claims, 'independent')
}
exports.flattenClaimsDependent = function(claims){
	return flattenClaims(claims, 'dependent')
}

exports.flattenClaims = flattenClaims
function flattenClaims(claims, type){
	if(claims && claims.data){
		claims = claims.data;
	}
	if(!claims){
		return claims
	}
	if(type && type == 'independent'){
		claims = claims.filter(isClaimIndependent)
	}
	else if(type && type == 'dependent'){
		claims = claims.filter(function(d){
			return !isClaimIndependent(d)
		})
	}

	claims = claims.map(function(cl){
		if(!cl.claim){ return ''; }
		return cl.claim.join("\n")
	})

	if(claims.length){
		claims ='<p>' + claims.join("</p>\n<p>") + '</p>';
	}
	else{
		claims = null
	}
	return claims
}

exports.extractNormal3Address = function(array){
	return extractNormalAddress(array, 3)
}
exports.extractNormal5Address = function(array){
	return extractNormalAddress(array, 5)
}


exports.extractNormal3Ids = function(array){
	return extractNormalIds(array, 3, 'assignee')
}

exports.extractNormal5Ids = function(array){
	return extractNormalIds(array, 5, 'inventor')
}

exports.extractNormal3 = function(array){
	return extractNormal(array, 3, 'assignee')
}
exports.extractNormal5 = function(array){
	return extractNormal(array, 5, 'inventor')
}


function extractNormalIds(array, normalId, field){

	let idField = field + '_id'
	let normalField = 'normal' + normalId
	if(!array || typeof array.map != 'function'){
		return []
	}

	let data = []

	array.forEach(function(d){
		console.info(d)
		if(!d[normalField]){
			data.push(d[idField])
			return
		}
		data.push(d[normalField].normal_id || d[idField])
	})

	// console.info(data)
	return data

}
function extractNormalAddress(array, normalId){

	let normalField = 'normal' + normalId
	if(!array || typeof array.map != 'function'){
		return ''
	}


	let address =  array.map(function(_d){
		console.info(_d)
		let d = _d[normalField]
		if(!_d[normalField]){
			d = _d
		}
		return [d.address, d.city, d.state, d.post_code, d.country]
			.filter(function(d){ return d})
			.join(' ');
		})
		.filter(function(d){ return d})


	return '<p>' + address.join("</p>\n<p>") + '</p>'

}
function extractNormal(array, normalId, dataField){

	let normalField = 'normal' + normalId
	if(!array || typeof array.map != 'function'){
		return ''
	}

	let data =  array.map(function(d){
		if(!d[normalField]){
			return d[dataField]
		}
		return  d[normalField][dataField] || d[dataField]
	})
	data = unique(data)

	return '<p>' + data.join("</p>\n<p>") + '</p>'
}


exports.extractReassignmentAddress = function(array){

	if(!array || typeof array.map != 'function'){
		return []
	}
	let address =  array.map(function(d){
		return  [d.address, d.city, d.state, d.post_code, d.country]
			.filter(function(d){ return d})
			.join(' ')

		})

	address = unique(address)
		.filter(function(d){ return d })

	if(!address.length){
		return ''
	}
	return '<p>' + address.join("</p>\n<p>") + '</p>'
}

exports.firstAssignee = function(array){
	let first;
	if(!array){ return }
	if(typeof array.forEach == 'function'){
		array.forEach(function(d){
			if(d.first_listed){
				first = d.assignee
			}
		})
	}

	if(!first && array[0]){
		first = array[0].assignee
	}

	return first;

}
exports.firstInventor = function(array){
	let first;
	if(!array){ return }
	if(typeof array.forEach == 'function'){
		array.forEach(function(d){
			if(d.first_listed){
				first = d.inventor
			}
		})
	}

	if(!first && array[0]){
		first = array[0].inventor
	}

	return first;

}

exports.extractAddress = extractAddress
function extractAddress(array){
	// console.info(arguments)
	if(!array || typeof array.map != 'function'){
		return ''
	}
	let address =  array.map(function(d){
		return [d.address, d.city, d.state, d.post_code, d.country]
			.filter(function(d){ return d})
			.join(' ');
		})
		.filter(function(d){ return d})

	if(!address.length){
		return ''
	}
	return '<p>' + address.join('</p><p>') + '</p>'
}

exports.extractNormalizedIds = function(array){
	debug(array)
	if(!array || typeof array.map != 'function'){
		return []
	}
	return array.map(function(d){ return d.normal_id; })
}

exports.timestamps = function(obj, fields){
	Object.keys(fields).forEach(function(key){
		if(!obj[fields[key]]){
			obj[key] = 0
			return
		}
		obj[key] = moment(obj[fields[key]], 'YYYYMMDD').unix();
	})
	return obj
}


exports.arrayLength = function(array){
	return array.length
}
exports.claimsCountIndependent = function(claims){
	return claims.filter(isClaimIndependent).length
}
exports.claimsCountDependent = function(claims){
	return claims.filter(function(d){
		return !isClaimIndependent(d)
	}).length
	// return claims.filter(function(d){
	// 	debug(d)
	// 	if(d.claim.join(' ').match(/according to claim/i)){
	// 		return true
	// 	}
	// 	return d.referenced_claim > 0;
	// }).length
}
function isClaimIndependent(d){
console.info(d)
	if(d.claim.join(' ').match(/according to claim/i)){
		return false
	}
	return d.referenced_claim == 0;
}


exports.year = function(unixTime){
	return moment.unix(unixTime).format('YYYY');
}

exports.years = function(obj, fields){
	// console.info(arguments)
	Object.keys(fields).forEach(function(key){
		// console.info(key)
		// console.info(fields[key])
		// console.info(obj[fields[key]])
		// console.info(moment(obj[fields[key]]).format('YYYY'))
		if(!obj[fields[key]]){
			obj[key] = 0
			return
		}
		obj[key] = moment.unix(obj[fields[key]]).format('YYYY');

		// obj[key] = obj[fields[key]].replace(/^(\d{4}).*/,"$1");
	})
	return obj
}

// function dates(obj){
// 	if(obj.publication_date){
// 		obj.publication_year = obj.publication_date.replace(/^(\d{4}).*/,"$1");
// 	}
// 	if(obj.filing_date){
// 		obj.filing_year = obj.filing_date.replace(/^(\d{4}).*/,"$1");
// 	}
//
// 	return obj
// }

function family(obj){
	// console.info(obj.familyIds)
	var  famTypes = ['docdb','simple','priority','extended']

	famTypes.forEach(function(d){
		// console.info(d)
		obj['family_'+d] = -(obj.patent_id)
		// console.info(d + ': ' + obj['family_'+d])
		// console.info(obj['family_'+d])
	})

	if(obj.familyIds && typeof obj.familyIds.forEach == 'function'){
		obj.familyIds.forEach(function(d){
			obj['family_'+d.family_type] = d.family_id
		})
	}
	return obj
}

exports.massageData = function(data, fields){

	data = processNotes(data)

	return _.map(data,function(_obj){
		_obj = cpcs(_obj)
		_obj = ipcs(_obj)
		_obj = usClasses(_obj)

		// _obj = dates(_obj, fields)
		// _obj = timestamps(_obj, fields)

		_obj = family(_obj)

		_obj = claims(_obj)

		// got status from equivalent doc
		if(_obj.status && typeof _obj.status === 'object'){
			// console.info(_obj.status);
			_obj.status = _obj.status.data;
		}


		_obj.json = JSON.stringify(_obj.json || {})




		if(_obj.patent_number && _obj.patent_number.match(/^EP.*A/i) && _obj.pct){
			_obj.pct_cross_ref = 1
		}
		delete _obj.pct;

		if(_obj.inventors && _obj.inventors[0]){
			_obj.inventor_ids = []
			_obj.inventors.forEach(function(a){
				if(a.inventor_id){
					_obj.inventor_ids.push(a.inventor_id)
				}
            })

			_obj.first_inventor = _obj.inventors[0].inventor;
		}
		if(_obj.assignees && _obj.assignees[0]){
			_obj.assignee_ids = []
			_obj.assignees.forEach(function(a){
				if(a.assignee_id){
					_obj.assignee_ids.push(a.assignee_id)
				}
		   })
			_obj.first_assignee = _obj.assignees[0].assignee;
		}

		_obj.assignees = _.map(_obj.assignees,function(item){ return item.assignee; }).join("\n")
		_obj.inventors = _.map(_obj.inventors,function(item){ return item.inventor; }).join("\n");








		if(_obj.description && _obj.description.data){
			_obj.description = _obj.description.data;
		}
		_obj.description = flattenDescription(_obj.description);

        // _obj.ta ='<p>' +_obj.title + '</p><p>' + _obj.abstract + '</p>';
        // _obj.tac ='<p>' +_obj.title + '</p><p>' + _obj.abstract + '</p>' + _obj.claims;
		_obj.ta ='<p>' + _.filter([_obj.title, _obj.abstract], function(d){ return d}).join('</p><p>') + '</p>'
		_obj.tac ='<p>' + _.filter([_obj.title, _obj.abstract, _obj.claims], function(d){ return d}).join('</p><p>') + '</p>'

		// debug('tac: ' + _obj.tac)
		// map data to index fields
		_.each(fields.allowedFields,function(dataKey,sphinxKey){

			if(_obj[sphinxKey] == null || typeof _obj[sphinxKey] == 'undefined'){
				_obj[sphinxKey] = (_obj[dataKey] || '');
			}
			// dates to unix
			if(sphinxKey.match(/_date/)){

				// get rid of any dashes in dates (mysql vs mongo)
				if(_obj[sphinxKey].replace){
					_obj[sphinxKey] = _obj[sphinxKey].replace(/\-/g,'')
				}

                if(!_obj[sphinxKey]){
                    _obj[sphinxKey] = 0;
                }
                else{
                    _obj[sphinxKey] = moment(_obj[sphinxKey],'YYYYMMDD').unix();
                }

			}

			if(sphinxKey.match(/_sort/) && !_obj[sphinxKey]){
				_obj[sphinxKey] = '_'
			}
		})

		_.each(_obj,function(val,key){
			if(!val){ return; }
			if(typeof val !== 'string') { return }
			_obj[key] = _obj[key].replace(/([\(\)\|\-\!\@\~\'\"\&\/\^\$\=\\])/g, "\\$1");
			_obj[key] = _obj[key].replace(/\\\\/g, "\\\\");
		})

		_.each(fields.mvaFields,function(val,key){

			_obj[key] =  (_obj[val]  || 'emptymva')
			if(_obj[key].length == 0){
				_obj[key] = 'emptymva'
			}
			else if(typeof _obj[key].map == 'function'){
				// pull out normal ids
				_obj[key] = _obj[key].map(function(d){
					if(d && d.normal_id){
						return d.normal_id
					}
					return d
				})
			}
		});
		_.each(fields.allowedFields,function(val,key){

			if(typeof _obj[key] === 'undefined' || _obj[key] === null){ return; }
			if(key.match(/_date/)){ return; }
			if(_obj[key].toString){
				_obj[key] =  _obj[key].toString();
			}

		});

        _obj.id = _obj.pat_id = _obj.patent_id = parseInt(_obj.patent_id,10);

		// edge case where abstract: 0
        if(_obj.abstract && _obj.abstract.match(/^\d+$/) ){
            _obj.abstract = '';
        }

		return _obj;
	})

}

exports.flattenDescription = flattenDescription
function flattenDescription(obj){
	var string = '';
	if(!obj){ return ''; }
	if(_.isString(obj)){ return obj; }

	// maintain header order
	if(obj.header){ string += obj.header + "\n"; }
	// if(obj.header){ string += '<p>' + obj.header + "</p>\n"; }
	if(obj.text){ string += flattenDescription(obj.text) + "\n" }
	// if(obj.text){ string += '<p>' + flattenDescription(obj.text) + "</p>\n" }
	if(_.isArray(obj)){
		_.each(obj,function(val){
			string += flattenDescription(val) + "\n";
		})
	}



	// return string
	return string.replace(/\n\n\n+/g,"\n\n" );
}

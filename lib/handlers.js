'use strict'

let fields
var processData = require('./process-data');
var version

var _ = require('underscore');
var async = require('async');
var squel = require("squel");
var debug = require('debug')('indexer:handlers');
var debugTime = require('debug')('indexer:handlers-time');

const changeCase = require('change-case')

var queries = require('ipc-queries')

function Handlers(_server) {

	fields = require('./fields')(_server.config('sphinx'));
	version = _server.config('sphinx').version || 'default'
	// console.info(version)

	this.server = _server;

	this.shard = require('./shard')(
		_server.config('sphinx').shardBy,
		_server.config('sphinx').shards
	);

	return this;
}

module.exports = function(_server) {
	return new Handlers(_server);
}

Handlers.prototype.updateNormal = updateNormal

function updateNormal(job, next) {

	debug(JSON.stringify(job));
	// var start = Date.now();
	var json = job.data;
	var ids = json.ids;
	if (!_.isArray(ids)) {
		ids = [ids];
	}

	var normalId = json.normalId;

	var data = _.map(ids, function(item) {
		return {
			patent_id: item
		};
	});

	debug(json.normalId);
	debug(json.normalType);

	var dataFn = queries.selectPatentAssigneeIds;
	if (json.normalType.match('inventor')) {
		dataFn = queries.selectPatentInventorIds;
	}

	var server = this.server;
	var self = this;

	async.series([

		// get patent numbers for shard.shardFn
		function(_next) {
			execAndMap(server.mysql(), queries.selectPatentNumsById(ids), data, _next);
		},
		function(_next) {
			execAndMap(server.mysql(), dataFn.call(queries, ids, normalId), data, function() {

				var key = 'normal_' + json.normalId + '_ids';

				var queue = async.queue(function(d, _n) {
					var _shard = self.shard(d);
					debug('shard:  ' + _shard);

					if (typeof d[key] === 'undefined') {
						d[key] = '';
					}
					// if (d[key] === undefined) {
					// 	d[key] = '';
					// }

					var q = 'update ' + self.server.config('sphinx').indexBase + '_' + _shard + ' SET ' + key + '=(' + d[key] + ') WHERE id=' + d.patent_id

					server.sphinxql().query(q, [], function(err, results) {
						if (err) throw err

						if(results.affectedRow == 0){
						    debug('send to regular indexer')
						    var msg = {
						    	user: json.user,
						    	ids: d.patent_id
						    }
						    self.server.rabbitRequest('indexer.rt',msg, function(err, response){
								debug(response)
						    	updateStatus(self.server, json.statusKey, json.statusField, 1)
						    	_n(err);
						    })
						}

						else if (json.statusKey && json.statusField) {
							updateStatus(self.server, json.statusKey, json.statusField, results.affectedRows)
							_n();
						}
						else{
							_n();
						}

					});

				}, 10)

				queue.drain = _next
				queue.push(data);
			})
		}
	], function(err) {
		next(err);
	})

}

function updateStatus(server, key, field, incr, cb){
	debug('update status: ' + field + ' - ' + incr)
	server.setStatus(key, 'lastUpdate', (new Date()).toISOString());
	server.incrementStatus(key, field, incr, cb);
}

Handlers.prototype.fullIndex = fullIndex
Handlers.prototype.processIndexQ = fullIndex

function fullIndex(job, next) {
	debug('processIndexQ')
	debug(job);
	var self = this;

	var server = self.server;

	var json = job.data;
	var statusKey = json.statusKey;
	var statusField = json.statusField;

	// clean up input
	var ids = json.ids || json.patent_ids;
	if (!_.isArray(ids)) {
		ids = [ids];
	}
	ids = _.uniq(_.map(ids, function(i) {
		return parseInt(i, 10);
	}));
	ids = ids.filter(function(v) {
		return !isNaN(v) && v > 0;
	});
	if (!ids || ids.length < 1) {
		return next();
	}

	var data = [];

	async.series([
		// function(_n){
		// 	var q =  'delete from patents_rt_dist where id IN(' + ids.join(',')+ ')'
		// 	server.sphinxql().query(q, function(){
		// 		// console.info(arguments)
		// 		_n()
		//
		// 	})
		// },

		function(_n) {

			debug('rabbitRequest')

			server.rabbitRequest('patent.20160317', {ids: ids}, function(res){

				data = res.data

				data.forEach(function(d){
					Object.keys(d).forEach(function(key){
						if(key != changeCase.camelCase(key)){

							d[changeCase.camelCase(key)] = d[key]
							delete d[key]
						}
					})
				})

				return _n();
			})
		},

  		function(_n){
			// data = processData.massageData(data, fields);

			let whitelist = {}
			Object.keys(fields.fields).forEach(function (field) {
				if(fields.fields[field].whitelist){
					whitelist[field] = true
				}
				if(fields.fields[field].blacklist){
					delete fields.fields[field]
				}
			})
			if(Object.keys(whitelist).length > 0){
				Object.keys(fields.fields).forEach(function (field) {
					if(!whitelist[field]){
						delete fields.fields[field]
					}
				})
			}

			let mappedData = require('./index/mapped').mapped(fields)
			let transform = require('./index/transform').transform(fields,[processData])
			let combinedFields = require('./index/combined').combined(fields)

			let castTypes = require('./index/types').cast(fields)
			let defaults = require('./index/types').defaults(fields)

			data = data
				.map(mappedData)
				.map(transform)
				.map(castTypes)
				.map(combinedFields)
				.map(defaults)

			if(data.length != 1){
				return _n()
			}
			if(!data[0].description){
				return _n()
			}

			// cant index these languages
			require('cld').detect(data[0].description, function(err, result) {
				// debug(arguments)
				if(err || !result){
					return _n()
				}
				if(!result.reliable || !result.languages){
					return _n()
				}

				if(result.languages[0].code == 'zh'){
					debug('delete chinese description')
					delete data[0].description
				}
				else if(result.languages[0].code == 'ja'){
					debug('delete japanese description')
					delete data[0].description
				}
				else if(result.languages[0].code == 'ko'){
					debug('delete korean description')
					delete data[0].description
				}
				_n()

			});
		}
    ], function(err) {
		// debug('series End')
		if (err) {
			console.trace();
			return next(err);
		}

		var _start = Date.now();
		// data.forEach(function(d){
		// 	debug(d.patent_number + ' cpcs: ' + d.cpcs)
		// })


		// data = fields.assignMappedFields(data);

		// data = fields.setRegion(data);
		// data = fields.setStatus(data);
		data = fields.checkAllowedFields(data);
		debug('post checkAllowedFields')


		// data = fields.checkForEmptyFields(data);
		debug('post fields.checkForEmptyTextFields')
		// debug(data)

		var queue = async.queue(function(_data, _n) {

			if (!_data || !_data.rows || _data.rows.length < 1) {
				return _n();
			}

			var query = createUpdateQuery(_data);
			// debug(query)

			// split up big queries
			if (processData.splitQuery(query, _data, queue)) {
				debug('splitQuery');
				return _n();
			}

			// debug('update index: ' + query)
			// _data.rows.forEach(function(d){
			// 	debug('cpm_string: ' + d.cpm_string)
			// })
			self.server.sphinxql().query(query, [], function(err, results) {
				// debug('update index results:')
				// debug(JSON.stringify(results));
				if (err) {
					console.info(err)
					if (json.meta && json.meta.queue && json.meta.queue.match('err')) {
						console.info(err)
					}

					_.each(_data.rows, function(item) {
						var _nums = {}
						_nums[item.patent_id] = item.patent_number;
						if (_data.rows.length > 1) {
							self.server.rabbitRequest('indexer.rt',{
								ids: [item.patent_id],
								nums: _nums
							})
						} else {
							var errQ = 'indexer.' + (self.server.config('errorQueue') || 'err')
							console.info('sending to ' + errQ + ': ' + item.patent_number);
							console.info(query)
							self.server.rabbitSend(errQ, {
								ids: [item.patent_id],
								nums: _nums
							})
						}
					})

					return _n(err);
				}

				if (statusKey && statusField) {
					debug('update status: ' + statusField + ' - ' + results.affectedRows)
					self.server.setStatus(statusKey, 'lastUpdate', (new Date()).toISOString());
					self.server.incrementStatus(statusKey, statusField, results.affectedRows);
					if (json.complete) {
						debug('update status complete')
						// utils.setStatus(statusKey, 'complete', true)
					}
				}


				var indexedIds = _.map(_data.rows, function(d){ return d.id; })
				updateIndexTS(
					indexedIds,
					self.server.config('sphinx').index,
					self.server.mysql(),
					function(err){
						if (err) {
							throw err;
						}
						_n();
					}
				)

			});
		}, 1);

		queue.drain = function() {
			debugTime('indexer: ' + (Date.now() - _start) + 'ms');
			next();
		}

		// debug('try to shard')
		// split into shards and send to queue
		queue.push(self.shard(data));
	});

}

function createUpdateQuery(_data){



	// make strings to ints to get rid of qoutes and prevent incorrect mva values
	_.each(_data.rows,function(d){
		// debug('d.patent_number: ' + d.patent_number)

		// _.each(fields.intFields, function(val, key){
		// 	d[key] = parseInt(d[key] || 0, 10)
		// })
		//
		// _.each(d, function(val, key) {
		// 	if (fields.mvaFields[key] && val) {
		// 		d[key] = 'mva(' + val + ')mva'
		// 	}
		// })
		//
		// _.each(d, function(val, key) {
		// 	if (fields.mvaFields[key] && val) {
		// 		d[key] = 'mva(' + val + ')mva'
		// 	}
		// })


		let keys = Object.keys(d)
		keys.sort();
		keys.forEach(function(k){
			if(typeof d[k] != 'number' && typeof d[k] != 'string'){
				debug(k + ': ' + d[k])
				debug(typeof d[k])
			}
			if(d[k] == '__empty__'){
				debug(k + ': ' + d[k])
			}
			if(d[k] == 'mva()mva'){
				debug(k + ': ' + d[k])
			}

		})

		// Object.keys(d).forEach(function(key){
		// 	if(key != changeCase.lowerCase(key) ){
		// 		d[changeCase.lowerCase(key)] = d[key]
		// 		delete d[key]
		// 	}
		// })
		// debug(d)

	})

	var q = squel
		.insert()
		.into(_data.index)
		.setFieldsRows(_data.rows);

	var query = q.toString().replace(/insert[\w\W]+?into/mi, 'REPLACE INTO')

	// empty mvas
	query = query.replace(/\'mva\(emptymva\)mva\'/g, "()")
	query = query.replace(/\'mva\(/g, "(")
	query = query.replace(/\)mva\'/g, ")")

	// status is a reserverd word, quote it
	query = query.replace(/\bstatus([,\)])/, "`status`$1");



	return query
}


// function exec(db, qObject, cb) {
//
// 	var groupConcat = 'SET SESSION group_concat_max_len = 1000000;'
//
// 	db.query(groupConcat + qObject.query, qObject.params, function(err, results) {
// 		if (err) throw err
// 		cb(err, results[1])
// 	});
// }

function execAndMap(db, qObject, data, cb) {
	// debug('execAndMap')

	var groupConcat = 'SET SESSION group_concat_max_len = 1000000;'

	db.query(groupConcat + qObject.query, qObject.params, function(err, results) {
		if (err) {
			console.info(groupConcat + qObject.query)
			throw err
		}

		debug(results[1]);
		_.each(results[1], function(cpm) {

			var match = _.find(data, function(item) {
				return cpm.patent_id == item.patent_id;
			});
			if (match) {
				_.each(cpm, function(val, key) {
					match[key] = val;
				})
			}
			else {
				debug('no match')
			}
		})
		cb(null, data);
	});
}

// function execAndMapNonGroupedRows(db, qObject, data, key, cb) {
// 	// debug('execAndMapNonGroupedRows')
//
// 	db.query(qObject.query, qObject.params, function(err, results) {
// 		if (err) {
// 			console.info(qObject.query)
// 			return cb(err);
// 		}
//
// 		// debug(results);
// 		_.each(results, function(row) {
//
// 			var match = _.find(data, function(item) {
// 				return row.patent_id === item.patent_id;
// 			});
// 			if (match) {
// 				if(!match[key]){
// 					match[key] = [];
// 				}
// 				match[key].push(row);
// 				// _.each(row, function(val, key) {
// 				// 	match[key] = val;
// 				// })
// 			}
// 		})
// 		cb(null, data);
// 	});
// }


// function getDocsFromMongo(ids, cb) {
//
// 	var cursor = mongo.find({
// 		patent_id: {
// 			$in: ids
// 		}
// 	}).sort({
// 		patent_id: 1
// 	});
// 	cursor.toArray(function(err, docs) {
// 		if (err) {
// 			return getDocsFromMongoBy10(ids, cb);
// 		} else {
// 			cb(null, docs)
// 		}
// 	});
// }

// function getDocsFromMongoBy10(ids, cb) {
// 	var _d = [];
//
// 	var n = 10;
// 	var lists = _.groupBy(ids, function(element, index) {
// 		return Math.floor(index / n);
// 	});
// 	lists = _.toArray(lists);
//
// 	var queue = async.queue(function(ids, next) {
// 		var cursor = mongo.find({
// 			patent_id: {
// 				$in: ids
// 			}
// 		}).sort({
// 			patent_id: 1
// 		});
// 		cursor.toArray(function(err, docs) {
// 			if (err) {
// 				getDocsFromMongoByOne(ids, function(err, _docs) {
// 					_d = _d.concat(_docs)
// 					next();
// 				});
// 			} else {
// 				_d = _d.concat(docs)
// 				next();
// 				// cb(null,docs)
// 			}
// 		});
// 	}, 1)
//
// 	queue.push(lists);
// 	queue.drain = function() {
// 		cb(null, _d);
// 	}
// }

// function getDocsFromMongoByOne(ids, cb) {
// 	var queue = async.queue(function(id, next) {
// 		var cursor = mongo.find({
// 			patent_id: id
// 		});
//
// 		cursor.nextObject(function(err, doc) {
// 			_d.push(doc)
// 			next();
// 		});
// 	}, 1)
//
// 	queue.push(ids);
// 	queue.drain = function() {
// 		cb(null, _d);
// 	}
// }

function updateIndexTS(patent_ids, index, mysql, cb) {
	var q = [
        'insert into prod_ip_data.index_ts',
        '(patent_id,`index`, search_engine,ts)',
        'values '
    ]
	if (!_.isArray(patent_ids)) {
		patent_ids = [patent_ids]
	}

	var vals = [];

	_.each(patent_ids, function(id) {
		vals.push('( ' + id + ',"' + index + '", "sphinx-' + version + '", NOW() )')
	});

	q.push(vals.join(','));
	q.push('on duplicate key update ts = NOW(), queued_ts = NULL');
	q = q.join(" ");

	// console.info(q)

	mysql.query(q, [], function(err) {
		if (typeof cb === 'function') {
			cb(err);
		} else if (err) {
			throw err
		}
	});
}

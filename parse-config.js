'use strict'


let config = `
# Minimal Sphinx configuration sample (clean, simple, functional)
#
# sudo /usr/local/sphinx-2.2.9/bin/searchd --config /home/sphinx/2016-03-17/etc/sphinx.conf --console


index patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_0
	type			= rt

	rt_mem_limit		= 3536M

	#charset_type		= utf-8

	# v3 compat
	#rt_field = pat_id
	rt_field = patentNumber
	rt_field = geography
	rt_field = applicationNumber
	#rt_field = gazelleFamily
	rt_field = title
	rt_field = abstract
	rt_field = claims
	#rt_field = cpmwStrinOwn
	#rt_field = cpmwStringChild
	rt_field = description
	rt_field = ipcs
	rt_field = cpcs
	rt_field = eclas
	rt_field = usClasses
	rt_field = assignee
	rt_field = firstAssignee
	rt_field = inventor
	rt_field = firstInventor

	rt_attr_uint = patId

	rt_attr_string = applicationNumberSort
	rt_attr_string = patentNumberSort
	rt_attr_string = titleSort
	rt_attr_string = firstAssigneeSort
	rt_attr_string = firstInventorSort

	rt_attr_timestamp = publicationDate
	rt_attr_uint = publicationYear
	#rt_attr_timestamp = publication_month
	#rt_attr_timestamp = publication_week
	rt_attr_timestamp = filingDate
	rt_attr_uint = filingYear



	# v4
	rt_field = cpmString
	rt_field = applicationNumberInt

	rt_field = claimsIndependent
	rt_field = claimsDependent

	rt_field = currentAssignee
	rt_field = currentAssigneeAddress
	rt_attr_multi = currentAssigneeIds
	rt_field = currentAssignee3
	rt_field = currentAssigneeAddress3
	rt_attr_multi = currentAssigneeIds3


	rt_field = reassignmentAssignee
	rt_field = reassignmentAssigneeAddress
	rt_attr_multi = reassignmentIds
	rt_field = reassignmentAssignee3
	rt_field = reassignmentAssigneeAddress3
	rt_attr_multi = reassignmentAssigneeIds3

	rt_field = originalAssignee
	rt_field = originalAssigneeAddress
	rt_attr_multi = originalAssigneeIds
	rt_field = originalAssignee3
	rt_field = originalAssigneeAddress3
	rt_attr_multi = originalAssigneeIds3



	rt_field = inventorAddress
	rt_attr_multi = inventorIds
	rt_field = inventor5
	rt_field = inventorAddress5
	rt_attr_multi = inventorIds5



	#rt_field = search_and_status
	rt_field = usClasses
	rt_field = usClassesCurrentMain

	rt_field = tac
	rt_field = ta

	#rt_attr_uint = patentId
	#rt_attr_uint = publicationDate_int
	#rt_attr_uint = filingDate_int
	#rt_attr_uint = application_date_int

	# 0: US G
	# 1: US App
	# 2:
	rt_attr_uint = status
	rt_attr_uint = crossRef
	rt_attr_uint = forwardCitationsCount
	rt_attr_uint = backwardCitationsCount
	#rt_attr_uint = backward_citations_count

	rt_attr_bigint = familyExtended
	rt_attr_bigint = familyDocdb
	rt_attr_bigint = familyPriority
	rt_attr_bigint = familySimple

	rt_attr_string = region
	rt_attr_uint = regionId

	#rt_attr_multi = searchIds
	rt_attr_json = json


	rt_attr_multi = ipcIds
	rt_attr_multi = eclaIds
	rt_attr_multi = usClassIds
	rt_attr_multi = cpcIds

	#rt_attr_multi = normal_7829_ids

	# default assignee normal
	#rt_attr_multi = normal3Ids

	# default inventor
	#rt_attr_multi = normal5Ids

	# Elanco
	#rt_attr_multi = normal10567Ids

	# LEC assgn
	#rt_attr_multi = normal7874Ids

	#rt_attr_multi = forwardCitations
	#rt_attr_multi = backwardCitations
	#rt_attr_multi = families


	rt_attr_uint = claimsCount
	rt_attr_uint = claimsIndependentCount
	rt_attr_uint = claimsDependentCount



	min_infix_len = 1
	#min_infix_len = 2
	#infix_fields = title,inventor,current_assignee,original_assignee,abstract,claims,description,patent_number,application_number,claims_independent,claims_dependent
	#prefix_fields = ipcs
	expand_keywords = 0
	dict = keywords
	index_sp = 1
	html_strip = 1
	index_exact_words = 1
	morphology = stem_en
	min_stemming_len = 3
}

index patents_rt_1 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_1
}
index patents_rt_2 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_2
}
index patents_rt_3 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_3
}
index patents_rt_4 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_4
}
index patents_rt_5 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_5
}
index patents_rt_6 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_6
}
index patents_rt_7 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_7
}
index patents_rt_8 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_8
}
index patents_rt_9 : patents_rt_0 {
	path			= /home/sphinx/2016-03-17/var/data/patents_rt_9
}

index patents_rt_dist {
	type = distributed
	local = patents_rt_0
	local = patents_rt_1
	local = patents_rt_2
	local = patents_rt_3
	local = patents_rt_4
	local = patents_rt_5
	local = patents_rt_6
	local = patents_rt_7
	local = patents_rt_8
	local = patents_rt_9
}

indexer {
	mem_limit		= 1512M
}

searchd {
	listen			= 9635
	listen			= 9636:mysql41
	log			= /home/sphinx/2016-03-17/var/log/searchd.log
	query_log		= /home/sphinx/2016-03-17/var/log/query.log
	pid_file		= /home/sphinx/2016-03-17/var/log/searchd.pid
	binlog_path		= /home/sphinx/2016-03-17/var/data
	read_timeout		= 5
	#client_timeout		= 180
	client_timeout		= 10
	max_children		= 300
	#max_children		= 0
	seamless_rotate		= 1
	preopen_indexes		= 1
	unlink_old		= 1
	workers			= threads # for RT to work
	dist_threads		= 10
	rt_flush_period		= 7200
	max_packet_size		= 128M
	mva_updates_pool	= 32M
}
`
let changeCase = require('change-case')
extractFields(config)

function extractFields(config){

    let lines = config.split(/\n/)
    lines.forEach(function(line){
        if(line.match(/^\s*rt_(field|attr)/)){
            // console.info(line)
            let tokens = line.split(/\s*=\s*/)

            // console.info(tokens)
            console.info('SPHINX_FIELDS_' + changeCase.sentence(tokens[1]).toUpperCase()+ '_TYPE=' + tokens[0].replace(/\s/g, '') )
        }
    })

}

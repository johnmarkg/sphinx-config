LINT_CONFIG ?= ./.eslint.json
LINT := ./node_modules/.bin/eslint

lint:
	@$(LINT)  --quiet --config $(LINT_CONFIG) *.js lib test

test: lint 
	./node_modules/.bin/_mocha

coverage:
	./node_modules/istanbul/lib/cli.js cover ./node_modules/.bin/_mocha	

.PHONY: lint test coverage

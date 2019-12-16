#
# Fuego Node.js project
#

PROJECT = "Fuego"

start : ;@echo "Starting ${PROJECT}....."; \
	nodemon

install: ;@echo "Installing ${PROJECT}....."; \
	npm install

update: ;@echo "Updating ${PROJECT}....."; \
	git pull --rebase; \
	npm install
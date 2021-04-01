# NodeJS Universign Client

[![npm version](https://badge.fury.io/js/%40digitregroup%2Funiversign-client.svg)](https://badge.fury.io/js/%40digitregroup%2Funiversign-client)
[![CircleCI](https://circleci.com/gh/digitregroup/universign-client.svg?style=shield)](https://circleci.com/gh/digitregroup/universign-client)
[![Coverage Status](https://coveralls.io/repos/github/digitregroup/universign-client/badge.svg?branch=master)](https://coveralls.io/github/digitregroup/universign-client?branch=master)


## Install

```bash
npm i @digitregroup/universign-client
# Or
yarn add @digitregroup/universign-client
```


## Unit tests

Tests are performed via Mocha/ChaiJS (Expect version).

```bash
  yarn lint
```


## Code style

This project should respect the linting configured in [@digitregroup/eslint-config](https://www.npmjs.com/package/@digitregroup/eslint-config).
```bash
  yarn lint
```

## DevOps
CI pipelines are performed in CircleCI for every single push in any branch.
CI is composed of Linting and Unit Testing with coverage requirement (specified in `package.json`)

CD pipeline is perfomed on git tag creation and release in NPM registry if the CI passed.

Note pipelines automaticaly check the `package.json`'s version to match with the git tag (or release/hotfix branch).


## Contributing

PR are welcome! We use gitflow :)

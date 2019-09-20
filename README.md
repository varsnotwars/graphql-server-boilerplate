# WORK IN PROGRESS

# Graphql Server Boilerplate

| Code Coverage              | Build Status            | License                   |
| :------------------------- | :---------------------- | :------------------------ |
| [![Coverage Status][1]][2] | [![Build Status][3]][4] | [![GitHub license][5]][6] |

[1]: https://coveralls.io/repos/github/varsnotwars/graphql-server-boilerplate/badge.svg?branch=master
[2]: https://coveralls.io/github/varsnotwars/graphql-server-boilerplate?branch=master
[3]: https://travis-ci.org/varsnotwars/graphql-server-boilerplate.svg?branch=master
[4]: https://travis-ci.org/varsnotwars/graphql-server-boilerplate
[5]: https://img.shields.io/badge/License-MIT-yellow.svg
[6]: https://github.com/varsnotwars/graphql-server-boilerplate/blob/master/LICENSE.md

### Features:

- Signup
- Login
- Logout (from single client or all clients)
- User confirmation
- Forgot password
- Sessions with cookies
- Authentication middleware
- Email sending (user confirmation, password resets)

### Uses:

- typeorm (vanilla javascript, no typescript)
- apollo server express
- mysql integration
- nodemailer integration

## TODO:

- move rate limiting settings to config
- move orm connection to context
- close session store cleanly ?
- cleanup the test file names and folder structures
- general code cleanup
- put expect res.errors toBeFalsy checks before all res.data.resolverName checks

## Note

- Tests must be run sequentially `--runInBand` flag is passed into jest, see package.json
- NODE_ENV uses windows syntax of `SET`
- Must explicitly provide a column type to typeorm

# WORK IN PROGRESS

# graphql-server-boilerplate

### Features:

- Signup
- Login
- Logout (from single client or all clients)
- User confirmation
- Forgot password
- Sessions with cookies
- Authentication middleware

### Uses:

- typeorm (no typescript, vanilla javascript)
- apollo server-express

## TODO:

- implement rate limiting
- move orm connection to context
- close session store cleanly ?
- cleanup the test file names and folder structures
- general code cleanup

## Note

- Tests must be run sequentially `--runInBand` flag is passed into jest, see package.json
- NODE_ENV uses windows syntax of `SET`

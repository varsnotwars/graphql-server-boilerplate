# WORK IN PROGRESS

# Graphql Server Boilerplate

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

- implement rate limiting
- move orm connection to context
- close session store cleanly ?
- cleanup the test file names and folder structures
- general code cleanup

## Note

- Tests must be run sequentially `--runInBand` flag is passed into jest, see package.json
- NODE_ENV uses windows syntax of `SET`

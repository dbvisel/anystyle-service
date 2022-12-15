const anystyleEndpoint = require('./api')

module.exports = {
  server: () => app => anystyleEndpoint(app),
}

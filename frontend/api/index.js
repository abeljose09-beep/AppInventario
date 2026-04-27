const app = require('./src/index.js');
app.get('/api/ping', (req, res) => res.send('pong'));
module.exports = app;

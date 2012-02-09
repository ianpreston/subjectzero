var fs = require('fs'), 

    express = require('express'),
    connect = require('connect'),
    mongoose = require('mongoose'),

    controllers = require('./controllers.js');

var config = JSON.parse(fs.readFileSync('config.json'));

var app = express.createServer();
app.use(connect.basicAuth(config.authUsername, config.authPassword));
app.use(express.bodyParser());

mongoose.connect(config.mongooseUrl)

app.get('/', controllers.indexController);
app.get('/template/create', controllers.templateCreateController);
app.post('/template/create', controllers.templateCreateController);
app.get('/template/:id/edit', controllers.templateEditController);
app.post('/template/:id/edit', controllers.templateEditController);
app.get('/template/:id/delete', controllers.templateDeleteController);
app.post('/template/:id/delete', controllers.templateDeleteController);
app.get('/page/create', controllers.pageCreateController);
app.post('/page/create', controllers.pageCreateController);

app.listen(config.httpPort, config.httpHost);
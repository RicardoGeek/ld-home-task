const express = require('express');
const { sequelize } = require('./model')

const app = express();

app.use(express.json())

app.set('sequelize', sequelize)
app.set('models', sequelize.models)

require('./routes')(app)

module.exports = app;

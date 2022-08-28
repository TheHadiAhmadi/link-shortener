const express = require('express')
const routes = require('./routes.js')
const path = require('path')

const app = express()

app.use(express.static(path.join(__dirname, './public')))
app.use(express.json())
app.use(express.urlencoded())
app.use(routes)

module.exports = app
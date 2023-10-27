const http = require('http');
const path = require('path');
const express = require('express');

const app = express(),
expressStaticGzip = require("express-static-gzip");

app.use(expressStaticGzip(path.join(__dirname, 'dist')));

app.get('*',(req, res) => {
  res.sendFile(path.join(__dirname, 'dist/adminportal/index.html'))
});

const port = process.env.PORT || '8084';
app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => console.log('Running'));

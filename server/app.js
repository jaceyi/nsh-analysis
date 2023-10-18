/* eslint-disable no-undef */
require('dotenv').config();
const express = require('express');
const notion = require('./notion.js');
const ocr = require('./ocr.js');

const app = express();
app.use(notion);
app.use(ocr);

app.listen(3001, () => {
  console.log('Server is listening on port 3001');
});

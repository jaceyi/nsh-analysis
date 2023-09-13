/* eslint-disable no-undef */
const express = require('express');
const cors = require('cors');
const notion = require('./notion.js');
const ocr = require('./ocr.js');

const app = express();
app.use(cors());
app.use(notion);
app.use(ocr);

app.listen(8888, () => {
  console.log('Server is listening on port 8888');
});

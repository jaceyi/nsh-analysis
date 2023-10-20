import 'dotenv/config';
import express from 'express';
import notion from './app/notion.js';
import ocr from './app/ocr.js';

const app = express();
app.use(
  express.json({
    limit: '10mb'
  })
);
app.use(notion);
app.use(ocr);

app.listen(3001, () => {
  console.log('Server is listening on port 3001');
});

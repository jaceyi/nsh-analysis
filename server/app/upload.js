import express from 'express';
import multer from 'multer';
import fs from 'fs';
import RequestUtils from '../utils/RequestUtils.js';

const router = express.Router();
const BASEPATH = '../public/uploads';
const storage = multer.diskStorage({
  destination: BASEPATH,
  filename(req, file, callback) {
    callback(null, file.originalname);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  const { file, body } = req;
  if (body.filename) {
    const newPath = `${BASEPATH}/${body.filename}`;
    const err = await fs.renameSync(file.path, newPath);
    if (!err) {
      RequestUtils.send(res, {
        originalName: file.originalname,
        filename: body.filename,
        url: newPath.replace(/^\.\./, '')
      });
    }
  } else {
    RequestUtils.send(res, {
      originalName: file.originalname,
      filename: file.filename,
      url: file.path.replace(/^\.\./, '')
    });
  }
});

export default router;

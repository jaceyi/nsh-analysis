import express from 'express';
import { body } from 'express-validator';
import env from '../utils/env.js';
import RequestUtils from '../utils/RequestUtils.js';

const router = express.Router();

const { NOTION_API_KEY } = env;

const { axiosInstance, request } = RequestUtils.createRequest({
  baseURL: 'https://api.notion.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
    Authorization: `Bearer ${NOTION_API_KEY}`
  }
});
axiosInstance.interceptors.response.use(res => {
  const [err, data] = res.data;
  if (err) {
    res.data = [new Error(data.message), data];
  }
  return res;
});

router.post(
  '/analysis/create',
  body('parent').notEmpty(),
  body('properties').notEmpty(),
  body('children').notEmpty(),
  async (req, res) => {
    if (RequestUtils.sendValidationError(req, res)) return;

    const { parent, properties, children } = req.body;
    const [err, data] = await request({
      method: 'post',
      url: '/pages',
      data: {
        parent,
        properties,
        children
      }
    });
    if (err) {
      return RequestUtils.sendError(res, 10000, err.message, data);
    }
    RequestUtils.send(res, data);
  }
);

router.post('/analysis/retrieve', body('id').notEmpty(), async (req, res) => {
  if (RequestUtils.sendValidationError(req, res)) return;
  const [err, data] = await request({
    method: 'get',
    url: `/databases/${req.body.id}`
  });
  if (err) {
    return RequestUtils.sendError(res, 10000, err.message, data);
  }
  RequestUtils.send(res, data);
});

export default router;

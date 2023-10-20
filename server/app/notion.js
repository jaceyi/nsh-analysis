import express from 'express';
import { body } from 'express-validator';
import env from '../utils/env.js';
import RequestUtils from '../utils/RequestUtils.js';

const router = express.Router();

const { NOTION_API_KEY } = env;

const NOTION_DATABASE_ID = '619d186c141843959512c83b13f9ec9d';

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

router.use(
  '/analysis/create',
  body('properties').notEmpty(),
  body('children').notEmpty(),
  async (req, res) => {
    if (RequestUtils.sendValidationError(req, res)) return;

    const { properties, children } = req.body;
    const [err, data] = await request({
      method: 'post',
      url: '/pages',
      data: {
        parent: {
          database_id: NOTION_DATABASE_ID
        },
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

export default router;

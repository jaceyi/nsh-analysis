import express from 'express';
import { body } from 'express-validator';
import env from '../utils/env.js';
import RequestUtils from '../utils/RequestUtils.js';

const router = express.Router();

const { BAIDU_OCR_AK, BAIDU_OCR_SK } = env;

const { axiosInstance, request } = RequestUtils.createRequest({
  method: 'POST',
  baseURL: 'https://aip.baidubce.com'
});
axiosInstance.interceptors.response.use(res => {
  const [, data] = res.data;
  if (data.object === 'error') {
    res.data = [new Error(`${data.error_msg} (${data.error_code})`), data];
  }
  return res;
});
/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */

router.post(
  '/ocr/accurate_basic',
  body('image').notEmpty(),
  async (req, res) => {
    if (RequestUtils.sendValidationError(req, res)) return;

    let accessToken;
    {
      /**
       * 使用 AK，SK 生成鉴权签名（Access Token）
       * @return string 鉴权签名信息（Access Token）
       */
      const [err, data] = await request(
        `/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_OCR_AK}&client_secret=${BAIDU_OCR_SK}`
      );
      if (err) {
        return RequestUtils.sendError(res, 10000, err.message, data);
      }
      accessToken = data.access_token;
      if (!accessToken) {
        return RequestUtils.sendError(
          res,
          10002,
          'Failed to obtain the "access_token".',
          data
        );
      }
    }

    {
      const params = new URLSearchParams();
      params.append('image', req.body.image);
      const [err, data] = await request({
        url: `/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      if (err) {
        return RequestUtils.sendError(res, 10000, err.message, data);
      }
      RequestUtils.send(res, data.words_result);
    }
  }
);

export default router;

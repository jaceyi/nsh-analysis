/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');

/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
const getAccessToken = async () => {
  const response = await axios({
    method: 'POST',
    url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`
  });
  return response.data.access_token;
};

const AK = process.env.BAIDU_OCR_AK;
const SK = process.env.BAIDU_OCR_SK;

router.post(
  '/ocr/accurate_basic',
  bodyParser.urlencoded({ limit: '10mb', extended: false }),
  async (req, res) => {
    const { image } = req.body;
    if (!image) {
      res.status(400).send('Required parameter "image" is missing');
      return;
    }
    try {
      const accessToken = await getAccessToken();
      const params = new URLSearchParams();
      params.append('image', image);
      const response = await axios({
        method: 'POST',
        url: `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      res.send(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  }
);

// 导出路由
module.exports = router;

/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

router.post('/databases', bodyParser.json(), async (req, res) => {
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.notion.com/v1/databases/${databaseId}/query`,
      headers: {
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        Authorization: `Bearer ${notionApiKey}`
      },
      data: req.body
    });

    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// 导出路由
module.exports = router;

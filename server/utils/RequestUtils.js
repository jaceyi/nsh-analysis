import axios from 'axios';
import { validationResult } from 'express-validator';

export default class RequestUtils {
  static createRequest(options) {
    const request = axios.create(options);
    request.interceptors.response.use(
      res => {
        return [null, res.data];
      },
      err => {
        return [err];
      }
    );
    return request;
  }

  /**
   * @param {object} res Express Response object
   * @param {number} code Error code
   * 10000:'Server Error'
   * 10001:'Request parameter error'
   * 10002:'Permission error'
   *
   * @param {string} msg Error message
   */
  static sendError(res, code, msg = 'Unknown error.') {
    res.status(200).send(
      JSON.stringify({
        code,
        msg
      })
    );
  }

  static send(res, data) {
    res.status(200).send(
      JSON.stringify({
        code: 0,
        data
      })
    );
  }

  static sendValidationError(req, res) {
    const result = validationResult(req);
    console.log(result.array());
    if (!result.isEmpty()) {
      RequestUtils.sendError(
        res,
        10001,
        `Request parameter ${result
          .array()
          .map(item => `"${item.path}" is an ${item.msg}`)
          .join(', ')}`
      );
      return true;
    }
  }
}

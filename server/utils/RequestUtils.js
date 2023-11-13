import axios from 'axios';
import { validationResult } from 'express-validator';

export default class RequestUtils {
  static createRequest(options) {
    const axiosInstance = axios.create(options);
    axiosInstance.interceptors.response.use(
      res => {
        res.data = [null, res.data];
        return res;
      },
      err => ({
        status: 200,
        statusText: 'Error transformed OK',
        config: err.config,
        headers: err.response?.headers,
        data: [err, err.response?.data]
      })
    );
    return {
      axiosInstance,
      request: async config => {
        return (await axiosInstance(config)).data;
      }
    };
  }

  static send(res, data) {
    res.status(200).send(
      JSON.stringify({
        code: 0,
        data
      })
    );
  }

  /**
   * @param {object} res Express Response object
   * @param {number} code Error code
   * 10000:'Server Error'
   * 10001:'Request parameter error'
   * 10002:'Permission error'
   *
   * @param {string} message Error message
   * @param {object} error Error object
   */
  static sendError(res, code, message, error) {
    res.status(200).send(
      JSON.stringify({
        code,
        message,
        error
      })
    );
  }

  static sendValidationError(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      RequestUtils.sendError(
        res,
        10001,
        `Request parameter ${result
          .array()
          .map(item => `"${item.path}" is an ${item.msg}`)
          .join(', ')}`,
        result
      );
      return true;
    }
  }
}

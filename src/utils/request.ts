import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const axiosInstance = axios.create({
  method: 'POST',
  baseURL: '/api/'
});

// custom interceptors
axiosInstance.interceptors.response.use(
  res => {
    const { data } = res;
    if (data.code === 0) {
      res.data = [null, data.data, res];
    } else {
      const message = `${data.code}: ${data.message}`;
      res.data = [new Error(message), data.data, res];
    }
    return res;
  },
  err => {
    if (!axios.isCancel(err)) {
      alert(err.message);
    }
    return {
      status: 200,
      statusText: 'Error transformed OK',
      config: err.config,
      headers: err.response?.headers,
      data: [err, err.response?.data]
    };
  }
);

export type InterceptAxiosResponse<T> =
  | [Error, T?, AxiosResponse<T>?]
  | [null, T, AxiosResponse<T>];

// custom request
const request = async <T = any>(config: AxiosRequestConfig) => {
  return (await axiosInstance<InterceptAxiosResponse<T>>(config)).data;
};

export default request;

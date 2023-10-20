import { useState, useRef, useEffect, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, Canceler } from 'axios';
import useDidUpdate from '@/hooks/useDidUpdate';

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
      alert(message);
    }
    return res;
  },
  err => {
    alert(err.message);
    return {
      status: 200,
      statusText: 'Error transformed OK',
      config: err.config,
      headers: err.response?.headers,
      data: [err, err.response?.data]
    };
  }
);

type InterceptAxiosResponse<T> =
  | [Error, T?, AxiosResponse<T>?]
  | [null, T, AxiosResponse<T>];
// custom request
const clientRequest = async <T = any>(config: AxiosRequestConfig) => {
  return (await axiosInstance<InterceptAxiosResponse<T>>(config)).data;
};

const COMPONENT_UPDATE_MESSAGE = 'component update';
const COMPONENT_UNMOUNT_MESSAGE = 'component unmount';

interface RequestCancelerRef {
  [key: string]: Canceler;
}

/**
 * @description 组件内请求的 hooks
 * @param inputs 改变会取消正在发起的请求
 */
const useRequest = (inputs: any[] = []) => {
  const requests = useRef<RequestCancelerRef>({});
  const [loading, setLoading] = useState(false);

  useDidUpdate(() => {
    cancelRequests(COMPONENT_UPDATE_MESSAGE);
  }, inputs);

  useEffect(() => {
    return () => {
      cancelRequests(COMPONENT_UNMOUNT_MESSAGE);
    };
  }, []);

  const cancelRequests = (message: string) => {
    const { current } = requests;

    for (let key in current) {
      current.hasOwnProperty(key) && current[key]?.(message);
    }
  };

  async function request<T = any>(
    url: string,
    data?: object,
    config?: object
  ): Promise<InterceptAxiosResponse<T>> {
    // 规定组件内所有请求都通过 此方法来发送以便维护
    !loading && setLoading(true);

    const _id = Math.random().toString(36).substring(2);
    const [error, response] = await clientRequest<T>(
      Object.assign({ data, url }, config, {
        cancelToken: new axios.CancelToken(cancel => {
          requests.current[_id] = cancel;
        })
      })
    );

    // 这里因为组件已经卸载了，就直接返回，不走下面的逻辑了
    if (axios.isCancel(error) && error.message === COMPONENT_UNMOUNT_MESSAGE) {
      return [error];
    }

    delete requests.current[_id];
    if (Object.keys(requests.current).length === 0) {
      setLoading(false);
    }

    return [error, response] as InterceptAxiosResponse<T>;
  }
  return [useCallback(request, [loading]), loading] as const;
};

export default useRequest;

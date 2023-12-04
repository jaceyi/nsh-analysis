import { useState, useRef, useEffect, useCallback } from 'react';
import axios, { AxiosRequestConfig, Canceler } from 'axios';
import useDidUpdate from '@/hooks/useDidUpdate';
import axiosRequest, { InterceptAxiosResponse } from '@/utils/request';
import { URLResponseMap } from '@/types/response';

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

  // 规定所有组件内的请求都通过 此方法来发送以便维护
  async function request<T = any>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ) {
    !loading && setLoading(true);

    const _id = Math.random().toString(36).substring(2);
    const [error, response] = await axiosRequest<T>(
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
      // 当前没有请求时结束 loading 状态
      setLoading(false);
    }

    return [error, response] as InterceptAxiosResponse<T>;
  }
  return [useCallback(request, [loading]), loading] as const;
};

export default useRequest;

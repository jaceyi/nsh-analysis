import React, { useEffect, useState } from 'react';
import { Upload, Button } from 'antd';
import styles from './style.module.scss';
import { useRequest } from '@/hooks';
import { RcFile } from 'antd/es/upload';
import { useParams } from 'react-router';
import { GangRetrieveResponse } from '@/types/response';

const WXUpload = () => {
  const { id } = useParams();
  const [imgSrc, setImgSrc] = useState(
    () => `/files/${id}.jpg?${new Date().getTime()}`
  );

  const [request, loading] = useRequest([id]);
  const [gangName, setGangName] = useState<string>('');
  useEffect(() => {
    (async () => {
      const [err, data] = await request<GangRetrieveResponse>(
        '/analysis/retrieve',
        { id }
      );
      if (!err) {
        setGangName(data.title.map(item => item.plain_text).join(''));
      }
    })();
  }, [id]);

  const beforeUpload = async (file: RcFile) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', `${id}.jpg`);
    const [err, res] = await request<{ url: string }>('/upload', formData);
    if (!err) {
      setImgSrc(res.url);
    }

    return false;
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>{gangName}</div>
      <Upload
        multiple
        accept="image/*"
        fileList={[]}
        beforeUpload={beforeUpload}
      >
        <Button type="primary" loading={loading}>
          上传图片
        </Button>
      </Upload>
      <img className={styles.preview} src={imgSrc} />
    </div>
  );
};

export default WXUpload;

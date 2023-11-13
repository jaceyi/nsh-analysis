import React, { useState } from 'react';
import { Upload, Button } from 'antd';
import styles from './style.module.scss';
import { useRequest } from '@/hooks';
import { RcFile } from 'antd/es/upload';
import { useParams } from 'react-router';

const WXUpload = () => {
  const { id } = useParams();
  const [imgSrc, setImgSrc] = useState('');

  const [request, loading] = useRequest();
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
      <Upload
        multiple
        accept="image/*"
        fileList={[]}
        beforeUpload={beforeUpload}
      >
        <Button type="primary" loading={loading}>
          上传最新微信群图片
        </Button>
      </Upload>
      <img className={styles.preview} src={imgSrc} />
    </div>
  );
};

export default WXUpload;

import React, { useEffect, useState } from 'react';
import { Spin, Steps } from 'antd';
import styles from './style.module.scss';
import { useLocalStorage, useRequest } from '@/hooks';
import Gang from './comps/Gang';
import Fight from './comps/Fight';
import Analysis from './comps/Analysis';
import { useParams } from 'react-router';

export interface GangInfo {
  title: string;
  url: string;
}
interface RetrieveResponse {
  title: any[];
  url: string;
}
const Home = () => {
  const { id } = useParams();
  const [request, loading] = useRequest([id]);
  const [gangInfo, setGangInfo] = useState<GangInfo | null>(null);
  useEffect(() => {
    (async () => {
      const [err, data] = await request<RetrieveResponse>(
        '/analysis/retrieve',
        { id }
      );
      if (!err) {
        setGangInfo({
          title: data.title.map(item => item.plain_text).join(''),
          url: data.url
        });
      }
    })();
  }, [id]);

  const [step, setStep] = useLocalStorage<number>(`${id}_STEP`, 0);

  const Component = [Gang, Fight, Analysis][step];

  if (!gangInfo) {
    if (loading)
      return (
        <Spin spinning>
          <div className={styles.text}>加载中...</div>
        </Spin>
      );
    return (
      <div className={styles.text}>
        <p>信息错误，请联系管理员</p>
        <p className="gray">微信号：jaceyi</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.name}>{gangInfo.title || '逆水寒'}</div>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={gangInfo.url}
        className={styles.link}
      >
        分析记录
      </a>
      <Steps
        className={styles.steps}
        direction="horizontal"
        type="inline"
        current={step}
        items={[
          {
            title: '帮会人员'
          },
          {
            title: '帮战信息'
          },
          {
            title: '数据分析'
          }
        ]}
      />
      <div className={styles.content}>
        <Component id={id!} onStepChange={setStep} gangInfo={gangInfo} />
      </div>
    </div>
  );
};

export default Home;

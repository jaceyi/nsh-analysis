import React from 'react';
import { Steps } from 'antd';
import styles from './style.module.scss';
import All from './comps/all';
import { useLocalStorage } from '@/hooks';

// TODO: 上传帮会人员图片=>生成人员表格（可附加上传）=>上传联赛参与人员图片=>选择联赛时间=>附加联赛信息至人员表格=>导出表格
const Home = () => {
  const [step, setStep] = useLocalStorage('STEP', 0);

  const Component = [All][step];

  return (
    <div className={styles.container}>
      <div className={styles.name}>揽风月</div>
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
        <Component onStepChange={setStep} />
      </div>
    </div>
  );
};

export default Home;

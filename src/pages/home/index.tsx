import React from 'react';
import styles from './style.module.scss';

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>逆水寒帮战分析</div>
      <div className="gray">
        <p>因涉及数据存储及隐私数据访问</p>
        <p>所以并不直接公开使用</p>
        <p>有需求请联系管理员</p>
        <p>（微信号：jaceyi）</p>
      </div>
    </div>
  );
};

export default Home;

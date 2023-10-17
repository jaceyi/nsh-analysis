import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import routers from '@/router';
import NotFound from '@/pages/not-found';
import Layout from './layout';
import { App, ConfigProvider } from 'antd';
import locale from 'antd/lib/locale/zh_CN';

const MyApp = () => {
  const indexRoute = routers[0];
  if (!indexRoute) return <NotFound />;

  return (
    <App>
      <ConfigProvider locale={locale}>
        <Routes>
          <Route element={<Layout />} path="/">
            {routers.map(({ Component, path }) => (
              <Route element={<Component />} key={path} path={path} />
            ))}
            <Route element={<NotFound />} path="*" />
          </Route>
        </Routes>
      </ConfigProvider>
    </App>
  );
};
export default MyApp;

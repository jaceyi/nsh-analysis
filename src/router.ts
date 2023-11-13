import { ComponentType } from 'react';
import Home from '@/pages';
import Gang from '@/pages/gang';
import WXUpload from '@/pages/wx-upload';

export interface RouteType {
  path: string;
  Component: ComponentType;
}
export type RouteLists = RouteType[];

const routes: RouteLists = [
  {
    path: '/',
    Component: Home
  },
  {
    path: '/g/:id',
    Component: Gang
  },
  {
    path: '/wx-upload/:id',
    Component: WXUpload
  }
];

export default routes;

import { ComponentType } from 'react';
import Home from '@/pages';
import Gang from '@/pages/gang';

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
  }
];

export default routes;

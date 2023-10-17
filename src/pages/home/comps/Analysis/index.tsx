import React, { useMemo, useState } from 'react';
import { Button, Table, Space, Tag, Form } from 'antd';
import styles from '../../style.module.scss';
import { useLocalStorage } from '@/hooks';
import { GangUser } from '../Gang';
import leven from 'leven';
import { tableSorter } from '@/utils';

interface FightProps {
  onStepChange: (current: number) => void;
}

const Analysis: React.FC<FightProps> = ({ onStepChange }) => {
  const [gangUsers, setGangUsers] = useLocalStorage<GangUser[]>(
    'GANG_USERS',
    []
  );
  const [fightNames, setFightNames] = useLocalStorage<string[]>(
    'FIGHT_NAMES',
    []
  );

  const dataSource = useMemo(() => {
    const matchs: string[] = [];
    return gangUsers
      .map(({ name, ...user }) => {
        let status = 0;
        if (fightNames.includes(name)) {
          status = 1;
          matchs.push(name);
        }
        return {
          ...user,
          gangName: name,
          fightName: name,
          status
        };
      })
      .map(user => {
        if (user.status) return user;
        const active = fightNames.find(
          fightName =>
            !matchs.includes(fightName) &&
            (fightName.length > 2 || user.gangName.length > 2) &&
            leven(fightName, user.gangName) <= 1
        );
        if (active) {
          user.status = 2;
          user.fightName = active;
        }
        return user;
      });
  }, [gangUsers, fightNames]);

  // modal
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  return (
    <div>
      <div className="flex-justify-center">
        <Space>
          <Button onClick={() => onStepChange(1)}>上一步</Button>
          <Button
            onClick={() => {
              setGangUsers([]);
              setFightNames([]);
            }}
          >
            清空全部内容
          </Button>
        </Space>
      </div>
      <Table
        title={() => (
          <p>{`当前总计${dataSource.length}人，参与帮战${
            dataSource.filter(item => item.status).length
          }人`}</p>
        )}
        className={styles.wrap}
        size="small"
        dataSource={dataSource}
        pagination={false}
        rowKey="gangName"
        columns={[
          {
            title: '人员',
            dataIndex: 'gangName',
            render: (t, { status, fightName }) => {
              return (
                <span>
                  {t}
                  {status === 2 && (
                    <span className="gray">（{fightName}）</span>
                  )}
                </span>
              );
            }
          },
          {
            title: '入帮时间',
            dataIndex: 'day',
            align: 'right',
            width: 100,
            sorter: tableSorter('day')
          },
          {
            title: '帮战',
            dataIndex: 'status',
            align: 'right',
            width: 80,
            sorter: tableSorter('status'),
            render: t =>
              t ? (
                <Tag
                  color={t === 1 ? 'success' : 'warning'}
                  style={{ marginRight: 0 }}
                >
                  ✓
                </Tag>
              ) : null
          }
        ]}
      />
    </div>
  );
};

export default Analysis;

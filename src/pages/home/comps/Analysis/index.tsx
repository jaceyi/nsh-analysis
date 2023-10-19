import React, { useMemo, useState } from 'react';
import { Button, Table, Space, Tag, DatePicker, App } from 'antd';
import styles from '../../style.module.scss';
import { useLocalStorage, useRequest } from '@/hooks';
import { GangUser } from '../Gang';
import leven from 'leven';
import { tableSorter } from '@/utils';
import dayjs, { Dayjs } from 'dayjs';

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

  const total = dataSource.length;
  const fightTotal = dataSource.filter(item => item.status).length;

  const [request, loading] = useRequest();
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const { message } = App.useApp();
  const handleExportNotion = async () => {
    if (!date) {
      message.warning('请选择日期');
      return;
    }
    const gangName = '揽风月';
    const [err, data] = await request('/analysis/create', {
      properties: {
        名称: {
          title: [
            {
              type: 'text',
              text: {
                content: `${gangName}${date.format('YYYY年MM月DD日')}帮战分析`
              }
            }
          ]
        },
        帮派: {
          rich_text: [
            {
              text: {
                content: gangName
              }
            }
          ]
        },
        日期: {
          date: {
            start: '2023-10-19'
          }
        },
        总人数: {
          number: total
        },
        帮战人数: {
          number: fightTotal
        }
      },
      children: [
        {
          table: {
            table_width: 3,
            has_column_header: true,
            has_row_header: false,
            children: [
              {
                table_row: {
                  cells: [
                    [
                      {
                        text: {
                          content: '人员'
                        }
                      }
                    ],
                    [
                      {
                        text: {
                          content: '入帮时间'
                        }
                      }
                    ],
                    [
                      {
                        text: {
                          content: '帮战'
                        }
                      }
                    ]
                  ]
                }
              },
              ...dataSource.map(item => ({
                table_row: {
                  cells: [
                    [
                      {
                        text: {
                          content: item.gangName
                        }
                      },
                      {
                        type: 'text',
                        text: {
                          content: `(${item.fightName})`
                        },
                        annotations: {
                          color: 'gray'
                        }
                      }
                    ],
                    [
                      {
                        text: {
                          content: item.day
                        }
                      }
                    ],
                    [
                      {
                        text: {
                          content: item.status ? '✓' : ''
                        }
                      }
                    ]
                  ]
                }
              }))
            ]
          }
        }
      ]
    });
    if (!err) {
      message.success('导出成功！');
    }
  };

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
        title={() => <p>{`当前总计${total}人，参与帮战${fightTotal}人`}</p>}
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
      <div style={{ marginBottom: 16 }}>
        <div>
          <span>日期：</span>
          <DatePicker
            value={date}
            onChange={setDate}
            style={{ width: 150 }}
            placement="bottomRight"
          />
        </div>
      </div>
      <div className="flex-justify-center">
        <Space>
          <Button onClick={() => onStepChange(1)}>上一步</Button>
          <Button
            type="primary"
            loading={loading}
            disabled={!dataSource.length}
            onClick={handleExportNotion}
          >
            导出至 Notion
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Analysis;

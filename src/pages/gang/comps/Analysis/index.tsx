import React, { useMemo, useRef, useState } from 'react';
import { Button, Table, Space, Tag, DatePicker, App, Drawer } from 'antd';
import styles from '../../style.module.scss';
import { useLocalStorage, useRequest } from '@/hooks';
import { GangUser } from '../Gang';
import leven from 'leven';
import { tableSorter } from '@/utils';
import type { Dayjs } from 'dayjs';
import { toPng } from 'html-to-image';
import { ColumnsType } from 'antd/es/table';
import { GangInfo } from '../..';

const getTextContent = (text: string, payload?: object) => ({
  text: {
    content: text
  },
  ...payload
});

interface FightProps {
  id: string;
  onStepChange: (current: number) => void;
  gangInfo: GangInfo;
}

const Analysis: React.FC<FightProps> = ({ id, onStepChange, gangInfo }) => {
  const [gangUsers, setGangUsers] = useLocalStorage<GangUser[]>(
    `${id}_GANG_USERS`,
    []
  );
  const [fightNames, setFightNames] = useLocalStorage<string[]>(
    `${id}_FIGHT_NAMES`,
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
      })
      .sort((a, b) => a.status - b.status);
  }, [gangUsers, fightNames]);

  const total = dataSource.length;
  const fightTotal = dataSource.filter(item => item.status).length;

  const [request, loading] = useRequest();
  const [date, setDate] = useState<Dayjs | null>(null);
  const [exportUrl, setExportUrl] = useState('');
  const { message } = App.useApp();
  const handleExportNotion = async () => {
    if (!date) {
      message.warning('请选择日期');
      return;
    }
    const [err, data] = await request<{ url: string }>('/analysis/create', {
      parent: {
        database_id: id
      },
      properties: {
        名称: {
          title: [getTextContent(`${date.format('YYYY年M月D日')}帮战`)]
        },
        日期: {
          date: {
            start: date.format('YYYY-MM-DD')
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
            table_width: 5,
            has_column_header: true,
            has_row_header: false,
            children: [
              {
                table_row: {
                  cells: [
                    [getTextContent('人员')],
                    [getTextContent('职业')],
                    [getTextContent('战力')],
                    [getTextContent('入帮时间')],
                    [getTextContent('帮战')]
                  ]
                }
              },
              ...dataSource.sort(tableSorter('status')).map(item => ({
                table_row: {
                  cells: [
                    [
                      getTextContent(item.gangName),
                      getTextContent(
                        item.status === 2 ? `(${item.fightName})` : '',
                        {
                          annotations: {
                            color: 'gray'
                          }
                        }
                      )
                    ],
                    [getTextContent(item.work)],
                    [getTextContent(String(item.number))],
                    [getTextContent(item.day)],
                    [getTextContent(item.status ? '参加' : '')]
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
      setExportUrl(data.url);
    }
  };

  const handleExportPNG = async () => {
    if (!date) {
      message.warning('请选择日期');
      return;
    }
    const dataUrl = await toPng(exportWrapper.current!, {
      quality: 0.95
    });
    const link = document.createElement('a');
    link.download = `${date?.format('YYYY-MM-DD')}帮战.png`;
    link.href = dataUrl;
    link.click();
  };
  (window as any).handleExportPNG = handleExportPNG;

  const exportWrapper = useRef<HTMLDivElement>(null);

  const columns: ColumnsType<(typeof dataSource)[0]> = [
    {
      title: '人员',
      dataIndex: 'gangName',
      render: (t, { status, fightName }) => {
        return (
          <span>
            {t}
            {status === 2 && <span className="gray">（{fightName}）</span>}
          </span>
        );
      }
    },
    {
      title: '职业',
      dataIndex: 'work',
      width: 46
    },
    {
      title: '入帮时间',
      dataIndex: 'day',
      align: 'right',
      width: 90,
      sorter: tableSorter('day')
    },
    {
      title: '帮战',
      dataIndex: 'status',
      align: 'right',
      width: 60,
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
  ];

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
        columns={columns}
      />
      <div style={{ marginBottom: 20 }}>
        <span>日期：</span>
        <DatePicker
          value={date}
          onChange={setDate}
          style={{ width: 150 }}
          placement="bottomRight"
        />
      </div>
      <div className="flex-justify-center" style={{ marginBottom: 20 }}>
        <Space>
          <Button onClick={() => onStepChange(1)}>上一步</Button>
          <Button
            loading={loading}
            disabled={!dataSource.length}
            onClick={handleExportPNG}
          >
            导出为图片
          </Button>
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
      {exportUrl && (
        <div style={{ margin: '16px 20px' }} className="flex-justify-center">
          <a target="_blank" rel="noopener noreferrer" href={exportUrl}>
            点此查看导出内容
          </a>
        </div>
      )}
      {/* export element */}
      <div style={{ margin: -10, height: 0, overflow: 'hidden' }}>
        <div
          style={{ padding: '20px 6px 22px', backgroundColor: '#fff' }}
          ref={exportWrapper}
        >
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 6 }}>{gangInfo.title}</h2>
            <p>{`${date?.format('YYYY-MM-DD')}帮战`}</p>
            <p>{`当前总计${total}人，参与帮战${fightTotal}人`}</p>
          </div>
          <Table
            className={styles.wrap}
            size="small"
            dataSource={dataSource}
            pagination={false}
            rowKey="gangName"
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};

export default Analysis;

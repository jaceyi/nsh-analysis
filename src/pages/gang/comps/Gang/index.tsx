import React from 'react';
import { Button, Upload, App, Table, Space } from 'antd';
import type { RcFile } from 'antd/es/upload';
import styles from '../../style.module.scss';
import { debounce, fileListToBase64List } from '@/utils';
import { useRequest, useLocalStorage } from '@/hooks';

export interface GangUser {
  name: string;
  position: string;
  level: number;
  work: string;
  number: number;
  day: string;
  online: string;
}

const POSITIONS = ['血河', '神相', '碎梦', '九灵', '素问', '铁衣'];

interface GangProps {
  id: string;
  onStepChange: (current: number) => void;
}

const Gang: React.FC<GangProps> = ({ id, onStepChange }) => {
  const { message } = App.useApp();
  const [request, loading] = useRequest();

  const [users, setUsers] = useLocalStorage<GangUser[]>(`${id}_GANG_USERS`, []);

  const transform = debounce(async (fileList: RcFile[]) => {
    const base64List = await fileListToBase64List(fileList);
    for (let i = 0; i < base64List.length; i++) {
      const base64 = base64List[i];
      const [err, data] = await request<{ words: string }[]>(
        '/ocr/accurate_basic',
        { image: base64 }
      );
      if (!err) {
        const _data: Partial<GangUser>[] = [];
        const length = data.length;
        if (
          // 每行七列数据拆分
          length % 7 !== 0 ||
          data.filter(word => POSITIONS.includes(word.words)).length <
            Math.floor(length / 7) // 职业条数小于行条数
        ) {
          message.warning(
            `图片 ${i + 1} 内容识别错误，请检查图片内容或重新截图尝试。`,
            3.6
          );
          continue;
        }
        data.forEach(({ words }, i) => {
          const remainder = i % 7;
          if (remainder === 0) {
            _data.push({
              name: words
            });
          } else {
            const active = _data[_data.length - 1];
            switch (remainder) {
              case 1:
              case 3:
              case 5:
              case 6: {
                const map = {
                  1: 'position',
                  3: 'work',
                  5: 'day',
                  6: 'online'
                } as const;
                active[map[remainder]] = words;
                break;
              }
              case 2:
              case 4: {
                const map = { 2: 'level', 4: 'number' } as const;
                active[map[remainder]] = +words;
                break;
              }
            }
          }
        });
        setUsers(users => [
          // 过滤重复
          ...users.filter(user => !_data.find(item => item.name === user.name)),
          ...(_data as GangUser[])
        ]);
      } else {
        message.error(`图片 ${i + 1} 识别失败`, 3);
      }
    }
  }, 100);
  const beforeUpload = (_: RcFile, fileList: RcFile[]) => {
    transform(fileList);
    return false;
  };

  return (
    <div>
      <div className="flex-justify-center">
        <Space>
          <Upload
            multiple
            accept="image/*"
            fileList={[]}
            beforeUpload={beforeUpload}
          >
            <Button type="primary" loading={loading}>
              上传帮会成员图片
            </Button>
          </Upload>
          {!!users.length && (
            <Button onClick={() => setUsers([])}>清空内容</Button>
          )}
        </Space>
      </div>
      {!!users.length && (
        <>
          <Table
            title={() => <p>总计{users.length}条数据</p>}
            className={styles.wrap}
            size="small"
            dataSource={users}
            pagination={false}
            rowKey="name"
            columns={[
              {
                title: '人员',
                dataIndex: 'name'
              },
              {
                title: '职业',
                dataIndex: 'work',
                width: 50
              },
              {
                title: '战力',
                dataIndex: 'number',
                width: 70,
                align: 'right'
              },
              {
                title: '入帮时间',
                dataIndex: 'day',
                width: 80,
                align: 'right'
              }
            ]}
          />
          <div className="flex-justify-center">
            <Button
              type="primary"
              disabled={!users.length}
              onClick={() => onStepChange(1)}
            >
              下一步
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Gang;

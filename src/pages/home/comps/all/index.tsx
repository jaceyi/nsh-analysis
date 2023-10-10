import React, { useState } from 'react';
import { Button, Upload, App, Table, Space } from 'antd';
import styles from './style.module.scss';
import { RcFile } from 'antd/es/upload';
import { debounce } from '@/utils';
import { useRequest, useLocalStorage } from '@/hooks';

const fileToBase64 = (file: RcFile): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
const fileListToBase64List = async (fileList: RcFile[]) => {
  const base64List: string[] = [];
  let index = 0;

  const processNextFile = async () => {
    if (index >= fileList.length) {
      return;
    }

    const file = fileList[index];
    index++;

    const base64 = await fileToBase64(file);
    base64List.push(base64);
    await processNextFile();
  };

  await processNextFile();
  return base64List;
};
const POSITIONS = ['血河', '神相', '碎梦', '九灵', '素问', '铁衣'];

interface AllProps {
  onStepChange: (current: number) => void;
}
interface WordRow {
  name: string;
  position: string;
  level: number;
  work: string;
  number: number;
  day: string;
  status: string;
}

const All: React.FC<AllProps> = ({ onStepChange }) => {
  const { message } = App.useApp();
  const [request, loading] = useRequest();

  const [users, setUsers] = useLocalStorage<WordRow[]>('ALL_USERS', []);

  const transform = debounce(async (fileList: RcFile[]) => {
    const base64List = await fileListToBase64List(fileList);
    const requests = base64List.map(base64 => {
      const params = new URLSearchParams();
      params.append('image', base64);
      return request<{ words_result: { words: string }[] }>(
        '/ocr/accurate_basic',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    });

    const results = await Promise.all(requests);
    for (let i = 0; i < results.length; i++) {
      const [err, res] = results[i];
      if (!err) {
        const data: Partial<WordRow>[] = [];
        const { words_result } = res.data;
        const length = words_result.length;
        if (
          // 每行七列数据拆分
          length % 7 !== 0 ||
          words_result.filter(word => POSITIONS.includes(word.words)).length <
            Math.floor(length / 7) // 职业条数小于行条数
        ) {
          message.warning(
            `图片 ${i + 1} 内容识别错误，请检查图片内容或重新截图尝试。`,
            3.6
          );
          continue;
        }
        words_result.forEach(({ words }, i) => {
          const remainder = i % 7;
          if (remainder === 0) {
            data.push({
              name: words
            });
          } else {
            const active = data[data.length - 1];
            switch (remainder) {
              case 1:
              case 3:
              case 5:
              case 6: {
                const map = {
                  1: 'position',
                  3: 'work',
                  5: 'day',
                  6: 'status'
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
          ...users.filter(user => data.find(item => item.name !== user.name)),
          ...(data as WordRow[])
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
    <div className={styles.container}>
      <div className={styles.handle}>
        <Space>
          <Upload beforeUpload={beforeUpload} fileList={[]} accept="image/*">
            <Button type="primary" loading={loading}>
              上传图片
            </Button>
          </Upload>
          {!!users.length && (
            <Button onClick={() => setUsers([])}>清空内容</Button>
          )}
        </Space>
      </div>
      {!!users.length && (
        <>
          <div className={styles.wrap}>
            <Table
              size="small"
              dataSource={users}
              pagination={false}
              scroll={{ x: 530 }}
              rowKey="name"
              columns={[
                {
                  title: '人员',
                  dataIndex: 'name',
                  width: 120,
                  fixed: 'left'
                },
                {
                  title: '职位',
                  dataIndex: 'position',
                  width: 80
                },
                {
                  title: '等级',
                  dataIndex: 'level',
                  width: 50
                },
                {
                  title: '职业',
                  dataIndex: 'work',
                  width: 50
                },
                {
                  title: '战力',
                  dataIndex: 'number',
                  width: 70
                },
                {
                  title: '入帮时间',
                  dataIndex: 'day',
                  width: 80
                },
                {
                  title: '上次在线',
                  dataIndex: 'status',
                  width: 80
                }
              ]}
            />
          </div>
          <div className={styles.handle}>
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

export default All;

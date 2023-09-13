import React, { useState } from 'react';
import { Button, Upload, App, Table, Space } from 'antd';
import styles from './style.module.scss';
import { RcFile } from 'antd/es/upload';
import { debounce } from '@/utils';
import { useRequest } from '@/hooks';

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

// TODO: 上传帮会人员图片=>生成人员表格（可附加上传）=>上传联赛参与人员图片=>选择联赛时间=>附加联赛信息至人员表格=>导出表格
const Home = () => {
  const { message } = App.useApp();

  const [images, setImages] = useState<string[]>([]);
  const getImageUrls = debounce(async (fileList: RcFile[]) => {
    const images = await fileListToBase64List(fileList);
    setImages(images);
  }, 100);
  const beforeUpload = (_: RcFile, fileList: RcFile[]) => {
    getImageUrls(fileList);
    return false;
  };
  const [request, loading] = useRequest();
  interface WordRow {
    name: string;
    position: string;
    level: number;
    work: string;
    number: number;
    day: string;
    status: string;
  }
  const [users, setUsers] = useState<WordRow[]>([]);
  const transform = async () => {
    const requests = images.map(image => {
      const params = new URLSearchParams();
      params.append('image', image);
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
        } else {
          message.success(`图片 ${i + 1} 识别成功`);
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
          ...users.filter(user => data.find(item => item.name === user.name)),
          ...(data as WordRow[])
        ]);
      } else {
        message.error(`图片 ${i + 1} 识别失败`, 3);
      }
    }
  };

  return (
    <div className={styles.container}>
      <Upload
        multiple
        beforeUpload={beforeUpload}
        fileList={[]}
        accept="image/*"
      >
        <Button type="primary">上传图片</Button>
      </Upload>
      <div className={styles.wrap}>
        {images.map((src, index) => (
          <img key={index} src={src} />
        ))}
      </div>
      <Space>
        <Button
          disabled={!images.length}
          type="primary"
          loading={loading}
          onClick={transform}
        >
          识别文字
        </Button>
        <Button disabled={!users.length} onClick={() => setUsers([])}>
          清空表格
        </Button>
      </Space>
      {!!users.length && (
        <Table
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
              title: '职位',
              dataIndex: 'position'
            },
            {
              title: '等级',
              dataIndex: 'level'
            },
            {
              title: '职业',
              dataIndex: 'work'
            },
            {
              title: '战力',
              dataIndex: 'number'
            },
            {
              title: '入帮时间',
              dataIndex: 'day'
            },
            {
              title: '上次在线',
              dataIndex: 'status'
            }
          ]}
        />
      )}
    </div>
  );
};

export default Home;

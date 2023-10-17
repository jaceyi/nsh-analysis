import React, { useMemo } from 'react';
import { Button, Upload, App, Table, Space, Tag } from 'antd';
import styles from '../../style.module.scss';
import { RcFile } from 'antd/es/upload';
import { debounce, fileListToBase64List } from '@/utils';
import { useRequest, useLocalStorage } from '@/hooks';
import type { GangUser } from '../Gang';
import leven from 'leven';

interface FightProps {
  onStepChange: (current: number) => void;
}

const Fight: React.FC<FightProps> = ({ onStepChange }) => {
  const { message } = App.useApp();
  const [request, loading] = useRequest();

  const [gangUsers] = useLocalStorage<GangUser[]>('GANG_USERS', []);
  const [fightNames, setFightNames] = useLocalStorage<string[]>(
    'FIGHT_NAMES',
    []
  );

  const transform = debounce(async (fileList: RcFile[]) => {
    const base64List = await fileListToBase64List(fileList);
    for (let i = 0; i < base64List.length; i++) {
      const base64 = base64List[i];
      const params = new URLSearchParams();
      params.append('image', base64);
      const [err, res] = await request<{
        words_result: { words: string }[];
        error_code?: string;
        error_msg?: string;
      }>('/ocr/accurate_basic', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (!err) {
        const { error_code, error_msg, words_result } = res.data;
        if (error_code) {
          message.error(error_msg);
          return;
        }
        setFightNames(fightNames => [
          ...new Set([...fightNames, ...words_result.map(item => item.words)])
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

  const dataSource = useMemo(() => {
    const matchs: string[] = [];
    const data = fightNames
      .map(fightName => {
        const active = gangUsers.find(user => user.name === fightName);
        if (active) {
          matchs.push(active.name);
        }
        return {
          fightName,
          gangName: fightName,
          status: active ? 1 : 0
        };
      })
      .map(item => {
        if (item.status) return item;
        const active = gangUsers.find(
          ({ name }) =>
            !matchs.includes(item.gangName) &&
            (name.length > 2 || item.fightName.length > 2) &&
            leven(name, item.fightName) <= 1
        );
        if (active) {
          item.status = 2;
          item.gangName = active.name;
        }
        return item;
      });
    return data;
  }, [fightNames, gangUsers]);

  return (
    <div>
      <div className="flex-justify-center">
        <Space>
          <Button onClick={() => onStepChange(0)}>上一步</Button>
          <Upload
            multiple
            accept="image/*"
            fileList={[]}
            beforeUpload={beforeUpload}
          >
            <Button type="primary" loading={loading}>
              上传帮战人员图片
            </Button>
          </Upload>
          {!!fightNames.length && (
            <Button onClick={() => setFightNames([])}>清空内容</Button>
          )}
        </Space>
      </div>
      {!!dataSource.length && (
        <>
          <Table
            title={() => <p>总计{dataSource.length}条数据</p>}
            className={styles.wrap}
            size="small"
            dataSource={dataSource}
            pagination={false}
            rowKey="fightName"
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
                title: '在帮',
                dataIndex: 'status',
                align: 'center',
                render: t =>
                  t ? (
                    <Tag
                      color={t === 1 ? 'success' : 'warning'}
                      style={{ marginRight: 0 }}
                    >
                      ✓
                    </Tag>
                  ) : null,
                width: 60
              }
            ]}
          />
          <div className="flex-justify-center">
            <Space>
              <Button onClick={() => onStepChange(0)}>上一步</Button>
              <Button
                type="primary"
                disabled={!fightNames.length}
                onClick={() => onStepChange(2)}
              >
                下一步
              </Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default Fight;

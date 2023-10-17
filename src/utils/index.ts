import type { RcFile } from 'antd/es/upload';

export const debounce = (func: Function, delay: number): Function => {
  let timer: number | null;

  return (...args: any[]) => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = window.setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

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
export const fileListToBase64List = async (fileList: RcFile[]) => {
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

/**
 * @description Antd 表格 排序
 * @param key
 * @returns {function(*, *): (number|*)}
 */
export const tableSorter = (key: string) => (a: any, b: any) => {
  if (b.noSort) return 0; // 不排序
  const aValue = parseFloat(a[key] || 0);
  const bValue = parseFloat(b[key] || 0);
  if (!Number.isFinite(aValue)) return -1;
  if (!Number.isFinite(bValue)) return 1;
  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};

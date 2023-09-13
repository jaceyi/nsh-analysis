export const getRandomId = () => Math.random().toString(36).substring(2);

export const getType = (variable: any) => {
  return Object.prototype.toString
    .call(variable)
    .replace(/\[object ([a-zA-Z]+)]/g, '$1')
    .toLowerCase();
};

export const isEmpty = (variable: any) => {
  const type = getType(variable);
  if (type === 'number') return false;
  if (type === 'null' || type === 'undefined') return true;
  return Object.keys(variable).length === 0;
};

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

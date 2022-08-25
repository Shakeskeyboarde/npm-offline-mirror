import nodeOs from 'node:os';

type Limiter = <TReturn>(task: () => Promise<TReturn>) => Promise<TReturn>;

const createLimiter = (): Limiter => {
  let active = 0;

  const max = Math.min(5, nodeOs.cpus().length + 1);
  const queue: (() => Promise<void>)[] = [];
  const next = () => {
    if (active > max) {
      return;
    }

    const task = queue.pop();

    if (!task) {
      return;
    }

    ++active;
    task().finally(() => {
      --active;
      next();
    });
  };

  return async (task) => {
    return new Promise((resolve, reject) => {
      queue.unshift(async () => task().then(resolve).catch(reject));
      next();
    });
  };
};

export { createLimiter };

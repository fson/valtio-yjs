import * as Y from 'yjs';
import { proxy } from 'valtio/vanilla';
import { bindProxyAndYArray, bindProxyAndYMap } from '../src/index';

describe('bindProxyAndYMap options', () => {
  it('transactionOrigin is included in Y.Doc events', async () => {
    const doc = new Y.Doc();
    const p = proxy<{ foo?: string }>({});
    const m = doc.getMap('map');

    const transactionOrigin = () => {
      const id = counter;
      counter += 1;
      return { id };
    };

    let counter = 0;
    bindProxyAndYMap(p, m, {
      transactionOrigin,
    });

    const fn = jest.fn();
    doc.on('updateV2', (_: Uint8Array, origin: any) => {
      fn(origin);
    });

    p.foo = 'bar';
    await Promise.resolve();
    expect(fn).toBeCalledWith(transactionOrigin);
    fn.mockClear();

    p.foo = 'baz';
    await Promise.resolve();
    expect(fn).toBeCalledWith(transactionOrigin);
  });

  it('bundles map updates into a single transaction', async () => {
    const doc = new Y.Doc();
    const p = proxy({ a: 0, b: 0, c: 0 });
    const m = doc.getMap('map');
    bindProxyAndYMap(p, m, { transactionOrigin: () => 'vy' });

    const onUpdate = jest.fn();
    doc.on('updateV2', onUpdate);

    p.a = 1;
    p.b = 2;
    p.c = 3;

    await Promise.resolve();
    expect(onUpdate).toBeCalledTimes(1);
  });
});

describe('bindProxyAndYArray', () => {
  it('transactionOrigin is included in Y.Doc events', async () => {
    const doc = new Y.Doc();
    const p = proxy<string[]>([]);
    const a = doc.getArray<string>('arr');

    const fn = jest.fn();
    doc.on('updateV2', (_: Uint8Array, origin: any) => {
      fn(origin);
    });

    const transactionOrigin = () => 'valtio-yjs';

    bindProxyAndYArray(p, a, { transactionOrigin });

    p.push('a');
    await Promise.resolve();
    expect(fn).toBeCalledWith(transactionOrigin);
  });
});

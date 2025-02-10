import { expect, test } from 'bun:test';
import { version } from '../package.json';
import { Service } from '../src';

const server = new Service();

test('metrics', async () => {
  const req = new Request('http://localhost/metrics');
  const res = await server.app.fetch(req);
  expect(res.status).toBe(200);
  const resText = await res.text();
  expect(resText.split('\n')).toContainValue(
    `shutterkit_version{version="${version}"} 1`,
  );
});

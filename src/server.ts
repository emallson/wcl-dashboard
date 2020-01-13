import Koa from 'koa';
import Router from 'koa-router';
import BodyParser from 'koa-bodyparser';

import serve from 'koa-static';
import mount from 'koa-mount';
import logger from 'koa-logger';
import json from 'koa-json';
import { config } from 'dotenv';

import { toApiKey, ReportCode, FightMeta } from './store';
import { QueryMeta } from './query';
import { load_meta, load_query_data } from './request';

if (process.env.NODE_ENV === 'development') {
  config();
}

const app = new Koa();

const API_KEY = toApiKey(process.env.API_KEY!);
const port = process.env.PORT || 8000;

const static_server = new Koa();
static_server.use(serve(__dirname + '/../build'));
app.use(mount('/', static_server));

app.use(BodyParser());
app.use(logger());
app.use(json());

const router = new Router();

interface ProxyRequest {
  code: ReportCode;
  query: QueryMeta;
  start: number;
  end: number;
}

router.post('/api/v1/proxy/query', async (ctx, next) => {
  const req: ProxyRequest = ctx.request.body;
  ctx.body = await load_query_data(
    API_KEY,
    req.code,
    req.start,
    req.end,
    req.query
  );
  if (ctx.body.status) {
    ctx.status = ctx.body.status;
  }
  await next();
});

router.get('/api/v1/proxy/meta/:code', async (ctx, next) => {
  ctx.body = await load_meta(API_KEY, ctx.params.code);
  if (ctx.body.status) {
    ctx.status = ctx.body.status;
  }
  await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.info('Started server...');
});

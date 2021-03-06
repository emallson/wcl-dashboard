import fetch from 'cross-fetch';
import { ApiKey, ReportCode } from './store';
import { QueryMeta, QueryType } from './query';
import queryString from 'query-string';

const BASE_URL = 'https://www.warcraftlogs.com:443/v1';

export async function zones(key: ApiKey) {
  const url = `${BASE_URL}/zones?${queryString.stringify({ api_key: key })}`;
  const res = await fetch(url);

  const body = await res.json();
  if (res.status >= 300) {
    throw new Error(`error response from the server: ${JSON.stringify(body)}`);
  }

  return body;
}

export async function load_meta(key: ApiKey, code: ReportCode) {
  const url =
    BASE_URL +
    `/report/fights/${code}?` +
    queryString.stringify({
      api_key: key,
      translate: true
    });
  const res = await fetch(url);

  const body = await res.json();
  return body;
}

export async function load_query_data(
  key: ApiKey,
  code: ReportCode,
  start: number,
  end: number,
  query: QueryMeta
) {
  let url = BASE_URL;
  switch (query.kind.kind) {
    case QueryType.Event:
      url += `/report/events/summary/${code}`;
      break;
    case QueryType.Table:
      url += `/report/tables/${query.kind.table}/${code}`;
      break;
  }

  url +=
    '?' +
    queryString.stringify({
      api_key: key,
      start,
      end,
      translate: true,
      filter: query.filter,
      ...(query.cutoff ? { cutoff: query.cutoff } : {})
    });

  console.log(url);

  const res = await fetch(url);

  const body = await res.json();
  return body;
}

const PROXY_HOST = '';

export async function proxy_meta(code: ReportCode) {
  const res = await fetch(`${PROXY_HOST}/api/v1/proxy/meta/${code}`);

  const body = await res.json();
  if (res.status >= 300) {
    throw new Error(body.error);
  }

  return body;
}

export async function proxy_query_data(
  code: ReportCode,
  start: number,
  end: number,
  query: QueryMeta
) {
  const res = await fetch(`${PROXY_HOST}/api/v1/proxy/query`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      start,
      end,
      query
    })
  });

  const body = await res.json();
  if (query.kind.kind === QueryType.Event && body.nextPageTimestamp) {
    const remainder = await proxy_query_data(
      code,
      body.nextPageTimestamp,
      end,
      query
    );
    body.events.push(...remainder.events);
    delete body.nextPageTimestamp;
  }
  if (res.status >= 300) {
    throw new Error(body.error);
  }

  return body;
}

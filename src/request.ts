import fetch from 'cross-fetch';
import { ApiKey, ReportCode, FightMeta } from './store';
import { QueryMeta, QueryType } from './query';
import queryString from 'query-string';

const BASE_URL = 'https://www.warcraftlogs.com:443/v1';

export async function load_meta(key: ApiKey, code: ReportCode) {
    const url = BASE_URL + `/report/fights/${code}?` + queryString.stringify({
        api_key: key,
    });
    const res = await fetch(url);

    const body = await res.json();
    if (res.status >= 300) {
        throw new Error(`error response from the server: ${JSON.stringify(body)}`);
    }

    return body;
}

export async function load_query_data(key: ApiKey, code: ReportCode, fight: FightMeta, query: QueryMeta) {
    let url = BASE_URL;
    switch(query.kind.kind) {
        case QueryType.Event:
            url += `/report/events/summary/${code}`;
            break;
        case QueryType.Table:
            url += `/report/tables/${query.kind.table}/${code}`;
            break;
    }

    url += '?' + queryString.stringify({
        api_key: key,
        start: fight.start_time,
        end: fight.end_time,
        filter: query.filter,
        ...(query.cutoff ? { cutoff: query.cutoff } : {})
    });

    console.log(url);

    const res = await fetch(url);

    const body = await res.json();
    if (res.status >= 300) {
        throw new Error(`error response from the server: ${JSON.stringify(body)}`);
    }

    return body;
}

import fetch from 'cross-fetch';
import { ApiKey, ReportCode } from './store';
import queryString from 'query-string';

const BASE_URL = 'https://www.warcraftlogs.com:443/v1';

export async function load_fights(key: ApiKey, code: ReportCode) {
    const url = BASE_URL + `/report/fights/${code}?` + queryString.stringify({
        api_key: key,
    });
    console.log(url);
    const res = await fetch(url);

    console.log(res);

    const body = await res.json();
    if (res.status >= 300) {
        throw new Error(`error response from the server: ${body}`);
    }

    return body.fights;
}

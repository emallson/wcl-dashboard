import { Action, createStore, applyMiddleware } from 'redux';
import thunkMiddleware, { ThunkAction } from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import immutableTransform from 'redux-persist-transform-immutable';
import compressTransform from 'redux-persist-transform-compress';


import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';
import { Guid as GuidCreator } from 'guid-typescript';
import { Map, Set, List, Seq } from 'immutable';

import { load_meta, load_query_data } from './request';
import { QueryVizData, QueryId, QueryMeta, queryKey, queryFormatData, createQueryMeta, shouldUpdate as shouldUpdateQuery, missingFights as queryFightsMissing } from './query';

export interface ApiKey extends Newtype<{readonly ApiKey: unique symbol}, string> {}

export const ApiKey = prism<ApiKey>((_s: string) => true)

export interface ReportCode extends Newtype<{readonly ReportCode: unique symbol}, string> {}
export const ReportCode = prism<ReportCode>((_s: string) => true)

export interface Guid extends Newtype<{readonly Guid: unique symbol}, string> {}
export const Guid = prism<Guid>(GuidCreator.isGuid);

export type VizState = {
    guid: Guid,
    spec: object,
    query: QueryMeta | null,
}

export type PendingUpdate = {
    key: [ReportCode, string, QueryId, number],
    data: QueryVizData,
};

export type AppState = {
    api_key: ApiKey | null,
    main_report: ReportCode | null,
    reports: Map<ReportCode, ReportState>,
    requests: {
        meta: Set<ReportCode>,
        queries: Set<[QueryId, ReportCode, number]>,
    },
    errors: List<any>,
    visualizations: Map<Guid, VizState>,
    pending_updates: List<PendingUpdate>,
};

export interface FightMeta {
    id: number,
    boss: number,
    name: string,
    start_time: number,
    end_time: number,
}

export interface ActorMeta {
    id: number,
    name: string,
}

export type ReportState = {
    code: ReportCode,
    fights: FightMeta[],
    friendlies: ActorMeta[],
    enemies: ActorMeta[],
    queries: Map<QueryId, Map<string, QueryVizData>>
};

export function lookupActor(report: ReportState, id: number): ActorMeta | undefined {
    const friendly = report.friendlies.find(({id: lid}) => id === lid);
    if(friendly) {
        return friendly;
    }
    return report.enemies.find(({id: lid}) => id === lid);
}

function emptyReportState(code: ReportCode): ReportState {
    return {
        code,
        fights: [],
        friendlies: [],
        enemies: [],
        queries: Map()
    };
}

const initialState: AppState = {
    api_key: null,
    main_report: null,
    reports: Map(),
    requests: {
        meta: Set(),
        queries: Set(),
    },
    errors: List(),
    visualizations: Map(),
    pending_updates: List(),
};

export function bossList(reports: Seq.Indexed<ReportState>): Map<number, string> {
    return reports.reduce((bosses, report: ReportState) => {
        return report.fights.filter(({ boss }) => boss > 0).reduce((bosses: Map<number, string>, fight: FightMeta) => bosses.set(fight.boss, fight.name), bosses);
    }, Map());
}

export const SET_API_KEY = Symbol("SET_API_KEY");
interface SetApiKeyAction {
    type: typeof SET_API_KEY
    key: ApiKey
}

export function setApiKey(key: string | ApiKey) {
    if (typeof key === 'string') {
        return {
            type: SET_API_KEY,
            key: toNullable(ApiKey.getOption(key))!,
        };
    } else {
        return {
            type: SET_API_KEY,
            key,
        };
    }
}

export const SET_MAIN_REPORT = Symbol("SET_MAIN_REPORT");
interface SetMainReportAction {
    type: typeof SET_MAIN_REPORT
    code: ReportCode
}

export function setMainReport(code: string | ReportCode) {
    if (typeof code === 'string') {
        return {
            type: SET_MAIN_REPORT,
            code: toNullable(ReportCode.getOption(code))!,
        };
    } else {
        return {
            type: SET_MAIN_REPORT,
            code,
        };
    }
}

export function hasReportMeta(state: AppState, code: ReportCode): boolean {
    return state.reports.has(code);
}

export function updateReport(code: ReportCode) {
    return requestMeta(code);
}

export const REQUEST_REPORT_META = Symbol("REQUEST_REPORT_META");
interface RequestReportMetaAction {
    type: typeof REQUEST_REPORT_META
    code: ReportCode
}

export function requestMeta(code: ReportCode): ThunkAction<void, AppState, undefined, Action> {
    return function(dispatch, getStore) {
        if (getStore().requests.meta.has(code)) {
            // request is already in-flight
            return;
        }

        dispatch({
            type: REQUEST_REPORT_META,
            code,
        });

        load_meta(getStore().api_key!, code)
            .then(body => dispatch({
                type: RETRIEVED_REPORT_META,
                code, body,
            }), message => dispatch({
                type: ERROR_REPORT_META,
                code,
                message,
            }))
            .then(() => dispatch(updateQueries(code)));
    };
}

export const RETRIEVED_REPORT_META = Symbol("RETRIEVED_REPORT_META");
interface RetrievedReportMeta {
    type: typeof RETRIEVED_REPORT_META,
    code: ReportCode,
    body: object,
}

export const ERROR_REPORT_META = Symbol("ERROR_REPORT_META");
interface ErrorReportMeta {
    type: typeof ERROR_REPORT_META,
    code: ReportCode,
    message: any,
}

export const UPDATE_QUERY = Symbol("UPDATE_QUERY");
interface UpdateQueryAction {
    type: typeof UPDATE_QUERY,
    code: ReportCode,
    query: QueryMeta,
    fights: number[]
}

export const RETRIEVED_UPDATE_QUERY = Symbol("RETRIEVED_UPDATE_QUERY");
interface RetrievedUpdateQueryAction {
    type: typeof RETRIEVED_UPDATE_QUERY,
    code: ReportCode,
    fight: number,
    query: QueryMeta,
    body: object,
}

export const ERROR_UPDATE_QUERY = Symbol("ERROR_UPDATE_QUERY");
interface ErrorUpdateQueryAction {
    type: typeof ERROR_UPDATE_QUERY,
    code: ReportCode,
    fight: number,
    query: QueryMeta,
    body: object,
}

export const MERGE_UPDATES = Symbol("MERGE_UPDATES");
interface MergeUpdatesAction {
    type: typeof MERGE_UPDATES,
}

export function updateQueries(code: ReportCode): ThunkAction<void, AppState, undefined, Action> {
    return function(dispatch, getState) {
        const app_state = getState();
        const queries = app_state.visualizations.filter((state) => state.query !== null && shouldUpdateQuery(state.query, code, app_state));

        const report = app_state.reports.get(code)!;

        queries.valueSeq().forEach(({query}) => {
            const fights = queryFightsMissing(query!, code, app_state);
            if (fights.length === 0) {
                return;
            }

            dispatch({
                type: UPDATE_QUERY,
                code, query, fights,
            });

            Promise.all(fights.map(fight => {
                return load_query_data(app_state.api_key!, code, report.fights.find(({ id }) => id === fight)!, query!)
                    .then(body => dispatch({
                        type: RETRIEVED_UPDATE_QUERY,
                        code, fight, query, body,
                    }),
                        body => {
                            console.error(body);
                            dispatch({
                                type: ERROR_UPDATE_QUERY,
                                code, fight, query, body
                            });
                        });
            })).then(() => dispatch({
                type: MERGE_UPDATES,
            }));
        });
    }
}

export const CREATE_VIZ = Symbol("CREATE_VIZ");
interface CreateVizAction {
    type: typeof CREATE_VIZ
}

export function createViz() {
    return {
        type: CREATE_VIZ,
    };
}

export const SET_VIZ_SPEC = Symbol("SET_VIZ_SPEC");
interface SetVizSpecAction {
    type: typeof SET_VIZ_SPEC
    spec: object,
    guid: Guid
}

export function setVizSpec(guid: Guid, spec: string | object) {
    if(typeof spec === 'string') {
        return {
            type: SET_VIZ_SPEC,
            guid,
            spec: JSON.parse(spec),
        };
    } else {
        return {
            type: SET_VIZ_SPEC,
            guid, spec
        };
    }
}

export const SET_VIZ_QUERY = Symbol("SET_VIZ_QUERY");
interface SetVizQueryAction {
    type: typeof SET_VIZ_QUERY,
    guid: Guid,
    query: QueryMeta,
}

export function setVizQuery(guid: Guid, kind: string, table: string | null, filter: string, bossid: string | null) {
    return {
        type: SET_VIZ_QUERY,
        guid: guid,
        query: createQueryMeta(kind, table, filter, bossid),
    };
}

export type MetaActions = RequestReportMetaAction | RetrievedReportMeta | ErrorReportMeta;
export type QueryAction = UpdateQueryAction | RetrievedUpdateQueryAction | ErrorUpdateQueryAction | MergeUpdatesAction;
export type VizAction = CreateVizAction | SetVizSpecAction | SetVizQueryAction;
export type DashboardAction = SetApiKeyAction | SetMainReportAction | MetaActions | VizAction | QueryAction;

function rootReducer(state = initialState, action: DashboardAction): AppState {
    switch(action.type) {
        case SET_API_KEY:
            return {
                ...state,
                api_key: action.key,
            };
        case SET_MAIN_REPORT:
            return {
                ...state,
                main_report: action.code,
            }
        case CREATE_VIZ:
            const guid = toNullable(Guid.getOption(GuidCreator.create().toString()))!;
            return {
                ...state,
                visualizations: state.visualizations.set(guid, {
                    guid,
                    spec: {},
                    query: null, 
                })
            };
        case SET_VIZ_SPEC:
            return {
                ...state,
                visualizations: state.visualizations.update(action.guid, value => {
                    return { ...value, spec: action.spec };
                })
            };
        case SET_VIZ_QUERY:
            return {
                ...state,
                visualizations: state.visualizations.updateIn([action.guid, 'query'], () => action.query),
            };
        case REQUEST_REPORT_META:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    meta: state.requests.meta.add(action.code),
                }
            };
        case RETRIEVED_REPORT_META:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    meta: state.requests.meta.remove(action.code),
                },
                reports: state.reports.update(
                    action.code, 
                    emptyReportState(action.code),
                    report => { return { ...report, ...action.body }; }
                ),
            };
        case ERROR_REPORT_META:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    meta: state.requests.meta.remove(action.code),
                },
                errors: state.errors.push(action.message),
            };
        case ERROR_UPDATE_QUERY:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    queries: state.requests.queries.remove([queryKey(action.query), action.code, action.fight])
                },
                errors: state.errors.push(action.body),
            };
        case RETRIEVED_UPDATE_QUERY:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    queries: state.requests.queries.remove([queryKey(action.query), action.code, action.fight])
                },
                pending_updates: state.pending_updates.push({ 
                    key: [action.code, 'queries', queryKey(action.query), action.fight], 
                    data: queryFormatData(action.code, action.fight, action.query, action.body, state)}
                ),
            };
        case MERGE_UPDATES:
            return {
                ...state,
                pending_updates: List(),
                reports: state.pending_updates.reduce((reports, { key, data }) => reports.setIn(key, data), state.reports),
            };
        default:
            // const dummy: never = action;
            console.log("no action found");
            return state;
    }
}

export default function buildStore() {
    const persistCfg = {
        key: 'root',
        storage,
        blacklist: ['requests', 'errors', 'pending_updates'],
        transforms: [immutableTransform(), compressTransform()],
        throttle: 5000,
    };

    const pReducer = persistReducer(persistCfg, rootReducer);
    const store = createStore(
        pReducer, 
        initialState,
        applyMiddleware(thunkMiddleware, createLogger())
    );

    return {
        store,
        persistor: persistStore(store),
    };
}

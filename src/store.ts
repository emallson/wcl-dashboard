import { Action, createStore, applyMiddleware } from 'redux';
import thunkMiddleware, { ThunkAction } from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import immutableTransform from 'redux-persist-transform-immutable';


import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';
import { Guid } from 'guid-typescript';
import { Map, Set, List } from 'immutable';

import { load_fights } from './request';

export interface ApiKey extends Newtype<{readonly ApiKey: unique symbol}, string> {}

export const ApiKey = prism<ApiKey>((_s: string) => true)

export interface ReportCode extends Newtype<{readonly ReportCode: unique symbol}, string> {}
export const ReportCode = prism<ReportCode>((_s: string) => true)

type QueryData = {
    query: string | null,
    bossid: string | null,
}

export type VizState = {
    guid: Guid,
    spec: object,
    query: QueryData,
}

export type AppState = {
    api_key: ApiKey | null,
    main_report: ReportCode | null,
    reports: Map<ReportCode, ReportState>,
    requests: {
        fights: Set<ReportCode>,
        actors: Set<ReportCode>,
    },
    errors: List<any>,
    visualizations: Map<Guid, VizState>,
};

export type ReportState = {
    code: ReportCode,
    fights: object[],
    actors: object[],
};

const initialState: AppState = {
    api_key: null,
    main_report: null,
    reports: Map(),
    requests: {
        fights: Set(),
        actors: Set(),
    },
    errors: List(),
    visualizations: Map(),
};

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

export function updateReport(code: ReportCode) {
    return requestFights(code);
}

export const REQUEST_REPORT_FIGHTS = Symbol("REQUEST_REPORT_FIGHTS");
interface RequestReportFightsAction {
    type: typeof REQUEST_REPORT_FIGHTS
    code: ReportCode
}

export function requestFights(code: ReportCode): ThunkAction<void, AppState, undefined, Action> {
    return function(dispatch, getStore) {
        if (getStore().requests.fights.contains(code)) {
            // request is already in-flight
            return;
        }

        dispatch({
            type: REQUEST_REPORT_FIGHTS,
            code,
        });

        console.info("requesting report", code);
        load_fights(getStore().api_key!, code)
            .then(fights => dispatch({
                type: RETRIEVED_REPORT_FIGHTS,
                code, fights,
            }), message => dispatch({
                type: ERROR_REPORT_FIGHTS,
                code,
                message,
            }));
    };
}

export const RETRIEVED_REPORT_FIGHTS = Symbol("RETRIEVED_REPORT_FIGHTS");
interface RetrievedReportFights {
    type: typeof RETRIEVED_REPORT_FIGHTS,
    code: ReportCode,
    fights: object[],
}

export const ERROR_REPORT_FIGHTS = Symbol("ERROR_REPORT_FIGHTS");
interface ErrorReportFights {
    type: typeof ERROR_REPORT_FIGHTS,
    code: ReportCode,
    message: any,
}

export const REQUEST_REPORT_ACTORS = Symbol("REQUEST_REPORT_ACTORS");
interface RequestReportActorsAction {
    type: typeof REQUEST_REPORT_ACTORS
    code: ReportCode
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

export type FightActions = RequestReportFightsAction | RetrievedReportFights | ErrorReportFights;
export type RequestAction = FightActions | RequestReportActorsAction;
export type DashboardAction = SetApiKeyAction | SetMainReportAction | RequestAction | CreateVizAction | SetVizSpecAction;

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
            const guid = Guid.create();
            return {
                ...state,
                visualizations: state.visualizations.set(guid, {
                    guid,
                    spec: {},
                    query: {
                        query: null,
                        bossid: null,
                    }
                })
            };
        case SET_VIZ_SPEC:
            return {
                ...state,
                visualizations: state.visualizations.update(action.guid, value => {
                    return { ...value, spec: action.spec };
                })
            };
        case REQUEST_REPORT_FIGHTS:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    fights: state.requests.fights.add(action.code),
                }
            };
        case RETRIEVED_REPORT_FIGHTS:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    fights: state.requests.fights.remove(action.code),
                },
                reports: state.reports.update(
                    action.code, 
                    { code: action.code, fights: action.fights, actors: [] },
                    report => { return {...report, fights: action.fights}; }
                ),
            };
        case ERROR_REPORT_FIGHTS:
            return {
                ...state,
                requests: {
                    ...state.requests,
                    fights: state.requests.fights.remove(action.code),
                },
                errors: state.errors.push(action.message),
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
        blacklist: ['requests'],
        transforms: [immutableTransform()],
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

import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';

export interface ApiKey extends Newtype<{readonly ApiKey: unique symbol}, string> {}

export const ApiKey = prism<ApiKey>((_s: string) => true)

export interface ReportCode extends Newtype<{readonly ReportCode: unique symbol}, string> {}

export type AppState = {
    api_key: ApiKey | null,
    reports: Map<ReportCode, ReportState>,
    requests: RequestAction[],
};

export type ReportState = {
    code: ReportCode,
    fights: object[],
    actors: object[],
};

const initialState: AppState = {
    api_key: null,
    reports: new Map(),
    requests: [],
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

export const REQUEST_REPORT_FIGHTS = Symbol("REQUEST_REPORT_FIGHTS");
interface RequestReportFightsAction {
    type: typeof REQUEST_REPORT_FIGHTS
    code: ReportCode
}

export const REQUEST_REPORT_ACTORS = Symbol("REQUEST_REPORT_ACTORS");
interface RequestReportActorsAction {
    type: typeof REQUEST_REPORT_ACTORS
    code: ReportCode
}

export type RequestAction = RequestReportActorsAction | RequestReportActorsAction;
export type DashboardAction = SetApiKeyAction | RequestAction;

function rootReducer(state = initialState, action: DashboardAction): AppState {
    switch(action.type) {
        case SET_API_KEY:
            return {
                ...state,
                api_key: action.key,
            };
        default:
            // const dummy: never = action;
            console.log("no action found");
            return state;
    }
}

export default function buildStore(preloadedState = initialState) {
    return createStore(
        rootReducer, 
        preloadedState,
        applyMiddleware(thunkMiddleware, createLogger())
    );
}

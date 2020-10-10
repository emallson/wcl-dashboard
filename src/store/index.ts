import { Reducer, Action, createStore, applyMiddleware } from 'redux';
import thunkMiddleware, { ThunkAction } from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';
import storage from 'localforage';
import immutableTransform from 'redux-persist-transform-immutable';

import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';
import { Guid as GuidCreator } from 'guid-typescript';
import { Map, OrderedMap, Set, List, Seq } from 'immutable';

import { notify_error } from '../notify';
import { proxy_meta, proxy_query_data } from '../request';
import {
  QueryId,
  QueryMeta,
  QueryRegion,
  QueryType,
  queryKey,
  queryFormatData,
  shouldUpdate as shouldUpdateQuery,
  missingFights as queryFightsMissing,
  isQueryMeta,
  storeData,
  clearDB as clearQueryDB
} from '../query';
import {
  reducer as vizReducer,
  VizList,
  VizState,
  VizAction
} from './visualization';
import {
  reducer as sectionReducer,
  SectionList,
  SectionAction
} from './section';
import { reducer as bulkExportReducer, BulkExportAction } from './bulk_export';

export interface ApiKey
  extends Newtype<{ readonly ApiKey: unique symbol }, string> {}

export const ApiKey = prism<ApiKey>((_s: string) => true);

export const toApiKey = (key: string) => toNullable(ApiKey.getOption(key))!;

export interface ReportCode
  extends Newtype<{ readonly ReportCode: unique symbol }, string> {}
export const ReportCode = prism<ReportCode>((_s: string) => true);
export const toReportCode = (code: string) =>
  toNullable(ReportCode.getOption(code))!;

export interface Guid
  extends Newtype<{ readonly Guid: unique symbol }, string> {}
export const Guid = prism<Guid>(GuidCreator.isGuid);
export const createGuid = () =>
  toNullable(Guid.getOption(GuidCreator.create().toString()))!;

export function isVizState(val: any): val is VizState {
  return (
    'guid' in val &&
    GuidCreator.isGuid(val.guid) &&
    'spec' in val &&
    'query' in val &&
    (val.query === null || isQueryMeta(val.query)) &&
    'index' in val &&
    typeof val.index === 'number'
  );
}

export type PendingUpdate = {
  key: [ReportCode, string, QueryId, string];
  index: number;
};

export type AppState = {
  version: number;
  main_report: ReportCode | null;
  reports: Map<ReportCode, ReportState>;
  requests: {
    meta: Set<ReportCode>;
    queries: Set<string>;
  };
  visualizations: VizList;
  sections: SectionList;
  pending_updates: List<PendingUpdate>;
  exporting: Guid | null;
  importing: boolean;
};

export interface FightMeta {
  id: number;
  boss: number;
  name: string;
  start_time: number;
  end_time: number;
}

export interface ActorMeta {
  id: number;
  name: string;
}

export type ReportState = {
  code: ReportCode;
  lastUsed: number | null;
  fights: FightMeta[];
  friendlies: ActorMeta[];
  enemies: ActorMeta[];
  queries: Map<QueryId, Map<string, number>>;
  start?: number;
  title?: string;
};

export function emptyReportState(code: ReportCode): ReportState {
  return {
    code,
    lastUsed: null,
    fights: [],
    friendlies: [],
    enemies: [],
    queries: Map()
  };
}

const CURRENT_VERSION = 6;

export function createState(): AppState {
  return {
    version: CURRENT_VERSION,
    main_report: null,
    reports: Map(),
    requests: {
      meta: Set(),
      queries: Set()
    },
    visualizations: OrderedMap(),
    sections: List(),
    pending_updates: List(),
    exporting: null,
    importing: false
  };
}

export const initialState: AppState = createState();

export function bossList(
  reports: Seq.Indexed<ReportState>
): Map<number, string> {
  return reports.reduce((bosses, report: ReportState) => {
    return report.fights
      .filter(({ boss }) => boss > 0)
      .reduce(
        (bosses: Map<number, string>, fight: FightMeta) =>
          bosses.set(fight.boss, fight.name),
        bosses
      );
  }, Map());
}

export const SET_MAIN_REPORT = Symbol('SET_MAIN_REPORT');
interface SetMainReportAction {
  type: typeof SET_MAIN_REPORT;
  code: ReportCode;
}

export function setMainReport(code: string | ReportCode) {
  if (typeof code === 'string') {
    return {
      type: SET_MAIN_REPORT,
      code: toNullable(ReportCode.getOption(code))!
    };
  } else {
    return {
      type: SET_MAIN_REPORT,
      code
    };
  }
}

export function hasReportMeta(state: AppState, code: ReportCode): boolean {
  return state.reports.has(code);
}

export function updateReport(code: ReportCode) {
  return requestMeta(code);
}

export const REQUEST_REPORT_META = Symbol('REQUEST_REPORT_META');
interface RequestReportMetaAction {
  type: typeof REQUEST_REPORT_META;
  code: ReportCode;
}

export function requestMeta(
  code: ReportCode
): ThunkAction<void, AppState, undefined, Action> {
  return function(dispatch, getStore) {
    if (getStore().requests.meta.has(code)) {
      // request is already in-flight
      return;
    }

    dispatch({
      type: REQUEST_REPORT_META,
      code
    });

    proxy_meta(code)
      .then(
        body =>
          dispatch({
            type: RETRIEVED_REPORT_META,
            code,
            body
          }),
        message =>
          dispatch({
            type: ERROR_REPORT_META,
            code,
            message
          })
      )
      .then(() => dispatch(updateQueries(code)));
  };
}

export const RETRIEVED_REPORT_META = Symbol('RETRIEVED_REPORT_META');
interface RetrievedReportMeta {
  type: typeof RETRIEVED_REPORT_META;
  code: ReportCode;
  body: object;
}

export const ERROR_REPORT_META = Symbol('ERROR_REPORT_META');
interface ErrorReportMeta {
  type: typeof ERROR_REPORT_META;
  code: ReportCode;
  message: any;
}

export const UPDATE_QUERY = Symbol('UPDATE_QUERY');
interface UpdateQueryAction {
  type: typeof UPDATE_QUERY;
  code: ReportCode;
  query: QueryMeta;
  fights: number[];
}

export function updateQueryKey(
  code: ReportCode,
  meta: QueryMeta,
  fight: number
) {
  return `${code.toString()}__${queryKey(meta)}__${fight}`;
}

export const RETRIEVED_UPDATE_QUERY = Symbol('RETRIEVED_UPDATE_QUERY');
interface RetrievedUpdateQueryAction {
  type: typeof RETRIEVED_UPDATE_QUERY;
  code: ReportCode;
  fight: number;
  query: QueryMeta;
  index: number;
}

export const ERROR_UPDATE_QUERY = Symbol('ERROR_UPDATE_QUERY');
interface ErrorUpdateQueryAction {
  type: typeof ERROR_UPDATE_QUERY;
  code: ReportCode;
  fight: number;
  query: QueryMeta;
  body: object;
}

export const MERGE_UPDATES = Symbol('MERGE_UPDATES');
interface MergeUpdatesAction {
  type: typeof MERGE_UPDATES;
}

// query data has been removed by some external force, clear out the
// stored index
export const CLEAR_QUERY_INDEX = Symbol('CLEAR_QUERY_INDEX');
interface ClearQueryIndexAction {
  type: typeof CLEAR_QUERY_INDEX;
  indices: number[];
}

export function clearQueryIndex(indices: number[]): ClearQueryIndexAction {
  return {
    type: CLEAR_QUERY_INDEX,
    indices
  };
}

export function updateQueries(
  code: ReportCode
): ThunkAction<void, AppState, undefined, Action> {
  return function(dispatch, getState) {
    const app_state = getState();
    const queries = app_state.visualizations.filter(
      state =>
        state.query !== null && shouldUpdateQuery(state.query, code, app_state)
    );

    const report = app_state.reports.get(code);

    if (report === undefined) {
      return; // nothing to do, no report data
    }

    queries.valueSeq().forEach(({ query }) => {
      const fights = queryFightsMissing(query!, code, app_state);
      if (fights.length === 0) {
        return;
      }

      dispatch({
        type: UPDATE_QUERY,
        code,
        query,
        fights
      });

      interface RegionReduce {
        last: number;
        regions: QueryRegion[];
      }

      const regionReducer = (
        reducer: RegionReduce,
        fight: number
      ): RegionReduce => {
        const fight_meta = report.fights.find(({ id }) => id === fight)!;
        if (fight === reducer.last + 1) {
          const region = reducer.regions[reducer.regions.length - 1];
          region.end = fight_meta.end_time;
          region.fights.push(fight);
        } else {
          reducer.regions.push({
            start: fight_meta.start_time,
            end: fight_meta.end_time,
            fights: [fight]
          });
        }

        reducer.last = fight;
        return reducer;
      };

      let regions = null;

      if (query!.kind.kind === QueryType.Event) {
        const initial_fight = report.fights.find(({ id }) => id === fights[0])!;
        const initial: RegionReduce = {
          last: fights[0],
          regions: [
            {
              fights: [fights[0]],
              start: initial_fight.start_time,
              end: initial_fight.end_time
            }
          ]
        };

        regions = fights.slice(1).reduce(regionReducer, initial).regions;
      } else if (query!.kind.kind === QueryType.Table) {
        regions = fights.map(fight => {
          const meta = report.fights.find(({ id }) => id === fight)!;
          return {
            fights: [fight],
            start: meta.start_time,
            end: meta.end_time
          };
        });
      }

      Promise.all(
        regions!.map(region => {
          return proxy_query_data(code, region.start, region.end, query!)
            .then(body => {
              const data = queryFormatData(
                code,
                region.fights,
                query!,
                body,
                app_state
              );
              return Promise.all(
                data.map((d, idx) =>
                  storeData(code, region.fights[idx], query!, d).then(index => [
                    region.fights[idx],
                    index
                  ])
                )
              );
            })
            .then(
              indices =>
                indices.forEach(([fight, index]) =>
                  dispatch({
                    type: RETRIEVED_UPDATE_QUERY,
                    code,
                    fight,
                    query,
                    index
                  })
                ),
              body => {
                console.error(body);
                fights.forEach(fight =>
                  dispatch({
                    type: ERROR_UPDATE_QUERY,
                    code,
                    fight,
                    query,
                    body
                  })
                );
              }
            );
        })
      ).then(() =>
        dispatch({
          type: MERGE_UPDATES
        })
      );
    });
  };
}

export const EXPORT_VIZ = Symbol('EXPORT_VIZ');
interface ExportVizAction {
  type: typeof EXPORT_VIZ;
  guid: Guid;
}

export function exportViz(guid: Guid) {
  return {
    type: EXPORT_VIZ,
    guid
  };
}

export const CLOSE_EXPORT_VIEW = Symbol('CLOSE_EXPORT_VIEW');
interface CloseExportViewAction {
  type: typeof CLOSE_EXPORT_VIEW;
}

export const BEGIN_IMPORT = Symbol('BEGIN_IMPORT');
interface BeginImportAction {
  type: typeof BEGIN_IMPORT;
}

export const CANCEL_IMPORT = Symbol('CANCEL_IMPORT');
interface CancelImportAction {
  type: typeof CANCEL_IMPORT;
}

export const IMPORT_VIZ = Symbol('IMPORT_VIZ');
interface ImportVizAction {
  type: typeof IMPORT_VIZ;
  state: VizState;
}

export function importViz(state: VizState) {
  return {
    type: IMPORT_VIZ,
    state
  };
}

export type MetaActions =
  | RequestReportMetaAction
  | RetrievedReportMeta
  | ErrorReportMeta;
export type QueryAction =
  | UpdateQueryAction
  | RetrievedUpdateQueryAction
  | ErrorUpdateQueryAction
  | MergeUpdatesAction
  | ClearQueryIndexAction;
export type ImportAction =
  | BeginImportAction
  | ImportVizAction
  | CancelImportAction;
export type ExportAction = ExportVizAction | CloseExportViewAction;
export type DashboardAction =
  | SetMainReportAction
  | MetaActions
  | VizAction
  | QueryAction
  | ImportAction
  | ExportAction
  | BulkExportAction
  | SectionAction;

const PURGE_CUTOFF_MS = 2.592e8;
function purgeQueries(state: AppState): AppState {
  const activeQueries = Set(
    state.visualizations
      .valueSeq()
      .filter(({ query }) => query !== null)
      .map(({ query }) => queryKey(query!))
  );

  const now = Date.now();
  const purgedReports = state.reports
    .map(report => {
      return {
        ...report,
        queries: report.queries.filter((_result, key) =>
          activeQueries.contains(key)
        )
      };
    })
    .filter(
      (report, code) =>
        state.main_report === code ||
        (report.queries.count() > 0 &&
          report.lastUsed &&
          now - report.lastUsed < PURGE_CUTOFF_MS)
    );

  return {
    ...state,
    reports: purgedReports
  };
}

function mainReducer(state = initialState, action: DashboardAction): AppState {
  switch (action.type) {
    case SET_MAIN_REPORT:
      const updatedReports = state.main_report
        ? state.reports.update(state.main_report, report => {
            // currently not erroring on receiving an invalid
            // report ugh
            if (report) {
              report.lastUsed = Date.now();
            }
            return report;
          })
        : state.reports;
      return {
        ...state,
        reports: updatedReports,
        main_report: action.code
      };
    case REQUEST_REPORT_META:
      return {
        ...state,
        requests: {
          ...state.requests,
          meta: state.requests.meta.add(action.code)
        }
      };
    case RETRIEVED_REPORT_META:
      return {
        ...state,
        requests: {
          ...state.requests,
          meta: state.requests.meta.remove(action.code)
        },
        reports: state.reports.update(
          action.code,
          emptyReportState(action.code),
          report => {
            return { ...report, ...action.body };
          }
        )
      };
    case ERROR_REPORT_META:
      notify_error(`Failed to retrieve fight list: ${action.message}`);
      return {
        ...state,
        requests: {
          ...state.requests,
          meta: state.requests.meta.remove(action.code)
        }
      };
    case UPDATE_QUERY:
      const queries = action.fights.reduce(
        (q, fight) => q.add(updateQueryKey(action.code, action.query, fight)),
        state.requests.queries
      );
      return {
        ...state,
        requests: {
          ...state.requests,
          queries
        }
      };
    case ERROR_UPDATE_QUERY:
      notify_error(
        `Failed to retrieve query (${action.query.filter}) result: ${action.body}`
      );
      return {
        ...state,
        requests: {
          ...state.requests,
          queries: state.requests.queries.delete(
            updateQueryKey(action.code, action.query, action.fight)
          )
        }
      };
    case RETRIEVED_UPDATE_QUERY:
      return {
        ...state,
        requests: {
          ...state.requests,
          queries: state.requests.queries.delete(
            updateQueryKey(action.code, action.query, action.fight)
          )
        },
        pending_updates: state.pending_updates.push({
          key: [
            action.code,
            'queries',
            queryKey(action.query),
            action.fight.toString()
          ],
          index: action.index
        })
      };
    case MERGE_UPDATES:
      const next_state = {
        ...state,
        pending_updates: List(),
        reports: state.pending_updates.reduce(
          (reports, { key, index }) => reports.setIn(key, index),
          state.reports
        )
      };
      return purgeQueries(next_state);
    case EXPORT_VIZ:
      return {
        ...state,
        exporting: action.guid
      };
    case CLOSE_EXPORT_VIEW:
      return {
        ...state,
        exporting: null
      };
    case BEGIN_IMPORT:
      return {
        ...state,
        importing: true
      };
    case CANCEL_IMPORT:
      return {
        ...state,
        importing: false
      };
    case IMPORT_VIZ:
      if (
        !('section' in action.state) ||
        state.sections.find(sec => sec.id === action.state.section) ===
          undefined
      ) {
        // if the section is missing or not defined, set it to null
        action.state.section = null;
      }
      return {
        ...state,
        visualizations: state.visualizations.set(
          action.state.guid,
          action.state
        ),
        importing: false
      };
    case CLEAR_QUERY_INDEX:
      return {
        ...state,
        reports: state.reports.map(report => {
          return {
            ...report,
            queries: report.queries.map(q =>
              q.filterNot(index => action.indices.includes(index))
            )
          };
        })
      };
    default:
      // const dummy: never = action;
      console.log('no action found');
      return state;
  }
}

function reduceReducers<S, A extends Action>(
  initialState: S,
  ...reducers: Reducer<S, A>[]
): Reducer<S, A> {
  return (state: S | undefined, action: A) => {
    if (state === undefined) {
      state = initialState;
    }
    return reducers.reduce(
      (curState, reducer) => reducer(curState, action),
      state
    );
  };
}

function vizReducerWrapper(
  state: AppState = initialState,
  action: DashboardAction
): AppState {
  return {
    ...state,
    visualizations: vizReducer(state.visualizations, action)
  };
}

function sectionReducerWrapper(
  state: AppState = initialState,
  action: DashboardAction
): AppState {
  return {
    ...state,
    sections: sectionReducer(state.sections, action)
  };
}

const bulkWrapper = (
  state: AppState = initialState,
  action: DashboardAction
) => {
  return {
    ...state,
    visualizations: bulkExportReducer(state.visualizations, action)
  };
};

export const rootReducer = reduceReducers(
  initialState,
  mainReducer,
  vizReducerWrapper,
  sectionReducerWrapper,
  bulkWrapper
);

const migrations = {
  0: (state: any) => {
    let index = 0;
    return {
      ...state,
      visualizations: state.visualizations.map((viz: any) => {
        if (typeof viz.index === 'number' && Number.isFinite(viz.index)) {
          index += 1;
          return viz;
        } else {
          viz.index = index;
          index += 1;
          return viz;
        }
      })
    };
  },
  2: (state: any) => {
    return {
      ...state,
      reports: state.reports.map((report: any) => {
        return {
          ...report,
          queries: Map()
        };
      })
    };
  },
  3: (state: any) => {
    clearQueryDB();
    return {
      ...state,
      reports: state.reports.map((report: any) => {
        return {
          ...report,
          queries: Map()
        };
      })
    };
  },
  4: (state: any) => {
    return {
      ...state,
      api_key: null
    };
  },
  5: (state: any) => {
    delete state.api_key;
    return state;
  },
  6: (state: any) => {
    return {
      ...state,
      sections: List(),
      visualizations: state.visualizations.map((viz: VizState) => ({
        ...viz,
        section: null
      }))
    };
  }
};

export default function buildStore() {
  const persistCfg = {
    key: 'root',
    version: CURRENT_VERSION,
    storage,
    blacklist: ['requests', 'pending_updates', 'exporting', 'importing'],
    transforms: [immutableTransform()],
    migrate: createMigrate(migrations, { debug: true })
  };

  const pReducer = persistReducer(persistCfg, rootReducer);
  const store = createStore(
    pReducer,
    initialState as any, // getting a type error after redux upgrade, ugh
    applyMiddleware(thunkMiddleware, createLogger())
  );

  return {
    store,
    persistor: persistStore(store)
  };
}

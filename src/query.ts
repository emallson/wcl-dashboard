import {
  AppState,
  ReportCode,
  ReportState,
  lookupActorName,
  updateQueryKey
} from './store';
import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';
import Dexie from 'dexie';

interface QueryDataRecord {
  id?: number;
  report: string;
  fight: number;
  queryKey: string;
  data: QueryVizData;
}

class QueryDataDB extends Dexie {
  records: Dexie.Table<QueryDataRecord, number>;

  constructor() {
    super('QueryData');
    this.version(1).stores({
      records: '++id, report, fight, queryKey'
    });

    this.records = this.table('records');
  }
}

const db = new QueryDataDB();

export function clearDB() {
  // used in migrations
  db.records.clear();
}

export enum QueryType {
  Event = 'event',
  Table = 'table'
}
export interface EventQuery {
  kind: typeof QueryType.Event;
}

export enum TableKind {
  Damage = 'damage-done',
  DamageTaken = 'damage-taken',
  Healing = 'healing'
}
export interface TableQuery {
  kind: typeof QueryType.Table;
  table: TableKind;
}

export type QueryKind = EventQuery | TableQuery;

export function isQueryKind(val: any): val is QueryKind {
  return (
    val.kind !== undefined &&
    (val.kind === QueryType.Event || val.kind === QueryType.Table) &&
    (val.kind !== QueryType.Table ||
      ('table' in val &&
        [TableKind.Damage, TableKind.DamageTaken, TableKind.Healing].includes(
          val.table
        )))
  );
}

export type QueryMeta = {
  filter: string;
  bossid: string | null;
  kind: QueryKind;
  cutoff?: number;
};

export function dummyEventMeta(): QueryMeta {
  return {
    filter: '',
    bossid: null,
    kind: { kind: QueryType.Event }
  };
}

export function isQueryMeta(val: any): val is QueryMeta {
  return (
    'filter' in val &&
    typeof val.filter === 'string' &&
    'bossid' in val &&
    (val.bossid === null || typeof val.bossid === 'string') &&
    'kind' in val &&
    isQueryKind(val.kind) &&
    (!('cutoff' in val) || typeof val.cutoff === 'number')
  );
}

export interface QueryId
  extends Newtype<{ readonly QueryId: unique symbol }, string> {}
export const QueryId = prism<QueryId>((_s: string) => true);

function queryKindKey(kind: QueryKind): string {
  if (kind.kind === QueryType.Event) {
    return 'event';
  } else {
    return `table-${kind.table}`;
  }
}
export function queryKey(query: QueryMeta): QueryId {
  return toNullable(
    QueryId.getOption(
      `${query.filter}::${queryKindKey(query.kind)}::${query.cutoff}`
    )
  )!;
}

async function loadFightData(
  report: ReportCode,
  fight: number | number[],
  query: QueryMeta
): Promise<QueryDataRecord[]> {
  return db.records
    .where({
      report: report.toString(),
      fight,
      meta: queryKey(query).toString()
    })
    .toArray();
}

export async function getDataById(
  indices: number[]
): Promise<(QueryDataRecord | undefined)[]> {
  return Promise.all(indices.map(index => db.records.get(index)));
}

export async function storeData(
  report: ReportCode,
  fight: number,
  query: QueryMeta,
  data: QueryVizData
): Promise<number> {
  console.log(report, fight, query, data, typeof data);
  return db.records.put({
    report: report.toString(),
    queryKey: queryKey(query).toString(),
    fight,
    data
  });
}

export function shouldUpdate(
  query: QueryMeta,
  report: ReportCode,
  state: AppState
): boolean {
  const report_data = state.reports.get(report);
  if (report_data === undefined) {
    return true; // report hasn't been loaded
  } else {
    const query_data = report_data.queries.get(queryKey(query));
    if (query_data === undefined) {
      return true; // query hasn't been run for this report
    } else if (missingFights(query, report, state).length > 0) {
      return true; // at least one fight needs to be collected
    }
  }
  return false;
}

export function relevantFights(
  query: QueryMeta,
  report: ReportCode,
  state: AppState
): number[] {
  const report_data = state.reports.get(report)!;
  const relevant_fights = report_data.fights
    .filter(({ boss }) => boss > 0) // only include boss fights, no trash
    .filter(
      ({ boss }) => query.bossid === null || String(boss) === query.bossid
    )
    .filter(
      ({ id }) =>
        !state.requests.queries.contains(updateQueryKey(report, query, id))
    )
    .map(({ id }) => id);
  return relevant_fights;
}

export function missingFights(
  query: QueryMeta,
  report: ReportCode,
  state: AppState
): number[] {
  const report_data = state.reports.get(report);
  if (report_data === undefined) {
    return []; // if there is no report, we don't need any fights
  }
  const query_data = report_data.queries.get(queryKey(query));
  const relevant_fights = relevantFights(query, report, state);
  if (query_data === undefined) {
    return relevant_fights;
  } else {
    return relevant_fights.filter(id => !query_data.has(id.toString()));
  }
}

function createQueryKind(kind: string, table: string | null): QueryKind {
  switch (kind) {
    case 'table':
      return {
        kind: QueryType.Table,
        table: table! as TableKind
      };

    default:
      return {
        kind: QueryType.Event
      };
  }
}

export function createQueryMeta(
  kind: string,
  table: string | null,
  filter: string,
  bossid: string | null,
  cutoff: number | undefined
): QueryMeta {
  return {
    filter,
    bossid,
    cutoff,
    kind: createQueryKind(kind, table)
  };
}

type RawEvent = {
  timestamp: number;
  sourceID?: number;
  targetID?: number;
};
type RawTableData = { entries: object[]; totalTime: number };
type RawEventData = { events: RawEvent[] };
export interface QueryRegion {
  start: number;
  end: number;
  fights: [number];
}

const splitData = (
  report: ReportState,
  data: RawEventData,
  fights: number[]
): RawEventData[] => {
  return fights.map(fight => {
    const meta = report.fights.find(({ id }) => id === fight)!;
    return {
      events: data.events.filter(
        ({ timestamp }) =>
          timestamp >= meta.start_time && timestamp <= meta.end_time
      )
    };
  });
};

export function queryFormatData(
  report: ReportCode,
  fights: number[],
  query: QueryMeta,
  data: object,
  state: AppState
): QueryVizData[] {
  switch (query.kind.kind) {
    case QueryType.Event:
      const edata = data as RawEventData;
      const report_data = state.reports.get(report)!;
      return splitData(report_data, edata, fights).map((edata, idx) => {
        return {
          name: 'data',
          values: edata.events.map(datum => {
            return {
              report,
              fight: fights[idx],
              sourceName: datum.sourceID
                ? lookupActorName(report_data, datum.sourceID, 'Unknown')
                : undefined,
              targetName: datum.targetID
                ? lookupActorName(report_data, datum.targetID, 'Unknown')
                : undefined,
              ...datum
            };
          })
        };
      });
    case QueryType.Table:
      const tdata = data as RawTableData;
      return [
        {
          name: 'data',
          values: tdata.entries.map((datum: object) => {
            return {
              report,
              fight: fights[0],
              totalTime: tdata.totalTime,
              ...datum
            };
          })
        }
      ];
  }
}

export type QueryVizData = {
  name: string;
  values: any[];
};
export async function queryData(
  query: QueryMeta,
  code: ReportCode,
  state: AppState
): Promise<QueryVizData | null> {
  const query_data = await loadFightData(
    code,
    relevantFights(query, code, state),
    query
  );
  if (query_data.length === 0) {
    return Promise.resolve(null);
  } else {
    const values = query_data
      .map(({ data }) => data)
      .reduce((full, { values: next }) => full.concat(next), [] as object[]);
    return Promise.resolve({
      name: 'data',
      values
    });
  }
}

export function queryDataChanged(
  newData: QueryVizData,
  oldData: QueryVizData
): boolean {
  // if the name or length has changed...
  if (
    newData.name !== oldData.name ||
    newData.values.length !== oldData.values.length
  ) {
    return true;
  }

  // or the timestmaps of the first/last events have changed
  if (newData.values.length > 0 && oldData.values.length > 0) {
    return (
      newData.values[0].timestamp !== oldData.values[0].timestamp ||
      newData.values[newData.values.length - 1].timestamp !==
        oldData.values[oldData.values.length - 1].timestamp
    );
  }

  return false;
}

import { AppState, ReportCode, lookupActorName } from './store';
import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';

export enum QueryType { Event = "event", Table = "table" }
export interface EventQuery {
    kind: typeof QueryType.Event,
}

export enum TableKind { 
    Damage = "damage-done", 
    DamageTaken = "damage-taken",
    Healing = "healing"
}
export interface TableQuery {
    kind: typeof QueryType.Table,
    table: TableKind,
}

export type QueryKind = EventQuery | TableQuery;

export function isQueryKind(val: any): val is QueryKind {
    return (val.kind !== undefined && (val.kind === QueryType.Event || val.kind === QueryType.Table) &&
        (val.kind !== QueryType.Table || ('table' in val && [TableKind.Damage, TableKind.DamageTaken, TableKind.Healing].includes(val.table))));
}

export type QueryMeta = {
    filter: string,
    bossid: string | null,
    kind: QueryKind,
    cutoff?: number,
}

export function isQueryMeta(val: any): val is QueryMeta {
    return ('filter' in val && typeof val.filter === 'string' &&
            'bossid' in val && (val.bossid === null || typeof val.bossid === 'string') &&
            'kind' in val && isQueryKind(val.kind) &&
            (!('cutoff' in val) || typeof val.cutoff === 'number'));
}

export interface QueryId extends Newtype<{readonly QueryId: unique symbol}, string> {}
export const QueryId = prism<QueryId>((_s: string) => true)

export function queryKey(query: QueryMeta): QueryId {
    return toNullable(QueryId.getOption(JSON.stringify(query)))!;
}

export function shouldUpdate(query: QueryMeta, report: ReportCode, state: AppState): boolean {
    const report_data = state.reports.get(report);
    if(report_data === undefined) {
        return true; // report hasn't been loaded
    } else {
        const query_data = report_data.queries.get(queryKey(query));
        if(query_data === undefined) {
            return true; // query hasn't been run for this report
        } else if (missingFights(query, report, state).length > 0) {
            return true; // at least one fight needs to be collected
        }
    }
    return false;
}

export function missingFights(query: QueryMeta, report: ReportCode, state: AppState): number[] {
    const report_data = state.reports.get(report)!;
    const query_data = report_data.queries.get(queryKey(query));
    const relevant_fights = report_data.fights
        .filter(({boss}) => boss > 0) // only include boss fights, no trash
        .filter(({boss}) => query.bossid === null || String(boss) === query.bossid)
        // TODO: this probably doesn't work as intended
        .filter(({id}) => !state.requests.queries.contains([queryKey(query), report, id]));
    if (query_data === undefined) {
        return relevant_fights.map(({id}) => id);
    } else {
        return relevant_fights.filter(({id}) => !query_data.has(id.toString()))
            .map(({id}) => id);
    }
}

function createQueryKind(kind: string, table: string | null): QueryKind {
    switch(kind) {
        case "table":
            return {
                kind: QueryType.Table,
                table: table! as TableKind
            };

        default:
            return {
                kind: QueryType.Event,
            };
    }
}

export function createQueryMeta(kind: string, table: string | null, filter: string, bossid: string | null, cutoff: number | undefined): QueryMeta {
    return {
        filter, bossid, cutoff,
        kind: createQueryKind(kind, table)
    };
}


type RawEvent = {
    timestamp: number,
    sourceID?: number,
    targetID?: number,
};
type RawTableData = { entries: object[], totalTime: number };
type RawEventData = { events: RawEvent[] };
export function queryFormatData(report: ReportCode, fight: number, query: QueryMeta, data: object, state: AppState): QueryVizData {
    switch(query.kind.kind) {
        case QueryType.Event:
            const edata = data as RawEventData;
            const report_data = state.reports.get(report)!;
            return {
                name: 'data',
                values: edata.events.map((datum) => {
                    return {
                        report, fight,
                        sourceName: datum.sourceID ? lookupActorName(report_data, datum.sourceID, "Unknown") : undefined,
                        targetName: datum.targetID ? lookupActorName(report_data, datum.targetID, "Unknown") : undefined,
                        ...datum,
                    };
                }),
            };
        case QueryType.Table:
            const tdata = data as RawTableData;
            return {
                name: 'data',
                values: tdata.entries.map((datum: object) => {
                    return {
                        report, fight,
                        totalTime: tdata.totalTime,
                        ...datum
                    }
                }),
            };
    }
}

export type QueryVizData = {
    name: string,
    values: any[],
};
export function queryData(query: QueryMeta, code: ReportCode | null, state: AppState): QueryVizData {
    if(code === null) {
        return { name: 'data', values: state.reports.valueSeq()
            .map(({code}) => queryData(query, code, state))
            .reduce((full, {values: next}) => full.concat(next), [] as object[])};
    } else {
        const query_data = state.reports.get(code)!.queries.get(queryKey(query));
        if(query_data === undefined) {
            return { name: 'data', values: [] }
        } else {
            return { name: 'data', values: query_data.valueSeq().reduce((full, {values: next}) => full.concat(next), [] as object[])};
        }
    }
}

export function queryDataChanged(newData: QueryVizData, oldData: QueryVizData): boolean {
    // if the name or length has changed...
    if(newData.name !== oldData.name || newData.values.length !== oldData.values.length) {
        return true;
    } 

    // or the timestmaps of the first/last events have changed
    if(newData.values.length > 0 && oldData.values.length > 0) {
        return newData.values[0].timestamp !== oldData.values[0].timestamp ||
            newData.values[newData.values.length - 1].timestamp !== oldData.values[oldData.values.length - 1].timestamp;
    }

    return false;
}

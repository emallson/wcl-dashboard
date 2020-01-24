import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { QueryMeta, QueryType, TableKind } from './query';
import { Guid, AppState, bossList } from './store';
import { setVizQuery } from './store/visualization';
import { Map } from 'immutable';

import './QueryBuilder.scss';

type QueryBuilderProps = {
  guid: Guid;
  meta: QueryMeta | null;
  setVizQuery: typeof setVizQuery;
  bosses: Map<number, string>;
};

const DEFAULT_VALUE = 'Query Type';
export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  guid,
  meta,
  setVizQuery,
  bosses
}) => {
  const tableKind = (meta: QueryMeta | null) =>
    meta && meta.kind.kind === QueryType.Table ? meta.kind.table : null;
  const bossSelector = meta ? (
    <>
      <label>Boss</label>
      <select
        defaultValue={meta.bossid || 'null'}
        onChange={e => {
          setVizQuery(
            guid,
            meta.kind.kind,
            tableKind(meta),
            meta.filter,
            e.target.value === 'null' ? null : e.target.value,
            meta.cutoff
          );
        }}
      >
        <option value={'null'}>Any</option>
        {bosses
          .map((name, bossid) => (
            <option key={String(bossid)} value={String(bossid)}>
              {name}
            </option>
          ))
          .valueSeq()
          .toJS()}
        {meta.bossid && !bosses.has(Number(meta.bossid)) ? (
          <option key={meta.bossid} value={meta.bossid}>
            Unknown ({meta.bossid})
          </option>
        ) : null}
      </select>
    </>
  ) : null;
  const tableSelector =
    meta && meta.kind.kind === QueryType.Table ? (
      <select
        defaultValue={meta.kind.table}
        onChange={e => {
          setVizQuery(
            guid,
            meta.kind.kind,
            e.target.value,
            meta.filter,
            meta.bossid,
            meta.cutoff
          );
        }}
      >
        <option value={TableKind.Damage}>Damage</option>
        <option value={TableKind.Healing}>Healing</option>
      </select>
    ) : null;
  const filterEditor = meta ? (
    <>
      <label>Filter</label>
      <textarea
        defaultValue={meta.filter}
        cols={40}
        rows={2}
        onBlur={e =>
          setVizQuery(
            guid,
            meta.kind.kind,
            tableKind(meta),
            e.target.value,
            meta.bossid,
            meta.cutoff
          )
        }
      />
    </>
  ) : null;

  const cutoffEditor = meta ? (
    <>
      <label>Cutoff</label>
      <input
        type="text"
        defaultValue={String(
          meta && meta.cutoff !== undefined ? meta.cutoff : ''
        )}
        onBlur={e =>
          setVizQuery(
            guid,
            meta.kind.kind,
            tableKind(meta),
            meta.filter,
            meta.bossid,
            e.target.value.length > 0 ? Number(e.target.value) : undefined
          )
        }
      />
    </>
  ) : null;
  return (
    <div className="query-builder">
      <label>Query Type</label>
      <select
        defaultValue={meta ? meta.kind.kind : DEFAULT_VALUE}
        onChange={e => {
          switch (e.target.value) {
            case QueryType.Event:
              setVizQuery(
                guid,
                e.target.value,
                null,
                meta ? meta.filter : '',
                meta ? meta.bossid : null,
                meta ? meta.cutoff : undefined
              );
              break;
            case QueryType.Table:
              // can't have already been table, default to
              // damage
              setVizQuery(
                guid,
                e.target.value,
                TableKind.Damage,
                meta ? meta.filter : '',
                meta ? meta.bossid : null,
                meta ? meta.cutoff : undefined
              );
              break;
            default:
              console.error(
                `attempt to change query kind to invalid value ${e.target.value}`
              );
          }
        }}
      >
        {!meta ? <option value={DEFAULT_VALUE}>Select Type</option> : null}
        <option value={QueryType.Event}>Event</option>
        <option value={QueryType.Table}>Table</option>
      </select>
      {tableSelector}
      <br />
      {filterEditor}
      <br />
      {bossSelector}
      <br />
      {cutoffEditor}
      <br />
    </div>
  );
};

const mapState = (state: AppState, { guid }: { guid: Guid }) => {
  const viz = state.visualizations.get(guid);
  if (viz) {
    return {
      guid,
      meta: viz.query,
      bosses: bossList(state.reports.valueSeq())
    };
  } else {
    return {
      guid,
      meta: null,
      bosses: bossList(state.reports.valueSeq())
    };
  }
};
const mapDispatch = (dispatch: Dispatch) => {
  return {
    setVizQuery: (
      guid: Guid,
      kind: string,
      table: string | null,
      filter: string,
      bossid: string | null,
      cutoff: number | undefined
    ) => dispatch(setVizQuery(guid, kind, table, filter, bossid, cutoff))
  };
};

export default connect(mapState, mapDispatch)(QueryBuilder);

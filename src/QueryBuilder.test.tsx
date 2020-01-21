import React from 'react';
import { createGuid } from './store';
import { QueryMeta, QueryType } from './query';
import { QueryBuilder } from './QueryBuilder';
import { Map } from 'immutable';
import { cleanup, render } from '@testing-library/react';

describe('Component: QueryBuilder', () => {
  afterEach(cleanup);

  it("should display a 'Unknown (bossid)' for queries whose boss is not in the bosses list", () => {
    const meta: QueryMeta = {
      filter: '',
      bossid: '2399',
      kind: {
        kind: QueryType.Event
      }
    };
    const bosses = Map()
      .set(0, 'a')
      .set(1, 'b')
      .set(2, 'c');
    const { getByText } = render(
      <QueryBuilder
        guid={createGuid()}
        meta={meta}
        bosses={bosses}
        setQueryViz={() => {}}
      />
    );
    expect(getByText(/Unknown/)).toBeTruthy();
  });

  it("should not display a 'Unknown (bossid)' for queries whose boss is in the bosses list", () => {
    const meta: QueryMeta = {
      filter: '',
      bossid: '2',
      kind: {
        kind: QueryType.Event
      }
    };
    const bosses = Map()
      .set(0, 'a')
      .set(1, 'b')
      .set(2, 'c');
    const { queryByText } = render(
      <QueryBuilder
        guid={createGuid()}
        meta={meta}
        bosses={bosses}
        setQueryViz={() => {}}
      />
    );
    expect(queryByText(/Unknown/)).toBeNull();
  });
});

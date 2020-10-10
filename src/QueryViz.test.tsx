import React from 'react';
import renderer from 'react-test-renderer';
import { QueryView, getDataIndices } from './QueryViz';
import serializer from 'jest-emotion';
import { AppState, toReportCode, createState, emptyReportState } from './store';
import { createQueryMeta, queryKey } from './query';
import { fromJS } from 'immutable';

// dealing with the grid loader
expect.addSnapshotSerializer(serializer);

const dummyFlip = () => {};

describe('QueryView', () => {
  const testSpec = {
    title: 'Testing, Dummy',
    mark: 'bar',
    encoding: {
      x: {
        field: 'x',
        type: 'quantitative'
      },
      y: {
        field: 'y',
        type: 'nominal'
      }
    }
  };

  const testData = [
    { x: 5, y: 'five' },
    { x: 10, y: 'ten' }
  ];

  it('renders correctly without data', () => {
    const tree = renderer.create(
      <QueryView data={null} loading={false} spec={testSpec} flip={dummyFlip} />
    );
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with some data', () => {
    const tree = renderer
      .create(
        <QueryView
          data={testData}
          loading={false}
          flip={dummyFlip}
          spec={testSpec}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when no data is relevant', () => {
    const tree = renderer
      .create(
        <QueryView data={[]} loading={false} flip={dummyFlip} spec={testSpec} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when loading', () => {
    const tree = renderer
      .create(
        <QueryView
          data={testData}
          loading={true}
          flip={dummyFlip}
          spec={testSpec}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe('getDataIndices', () => {
  it('should return indices in order', () => {
    const code = toReportCode('code');
    const state: AppState = createState();

    const query = createQueryMeta(
      'event',
      null,
      'test filter',
      null,
      undefined
    );

    const report = {
      ...emptyReportState(code),
      fights: [
        { id: 1, boss: 1, name: '1', start_time: 0, end_time: 2 },
        { id: 3, boss: 1, name: '1', start_time: 8, end_time: 10 },
        { id: 2, boss: 1, name: '1', start_time: 3, end_time: 7 },
        { id: 4, boss: 1, name: '1', start_time: 11, end_time: 20 }
      ],
      queries: fromJS({
        [queryKey(query)]: { '3': 2, '1': 3, '2': 1, '4': 4 }
      })
    };

    state.reports = state.reports.set(code, report);

    const indices: number[] = getDataIndices(state, code, query);

    const expected = report.fights
      .sort(({ start_time: a }, { start_time: b }) => a - b)
      .map(({ id }) => report.queries.getIn([queryKey(query), id.toString()]));

    expect(indices).toEqual(expected);
  });
});

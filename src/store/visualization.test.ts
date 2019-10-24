import { OrderedMap } from 'immutable';

import * as viz from './visualization';
import { QueryType } from '../query';

describe('visualization actions', () => {
    describe('create viz', () => {
        it('should add new vizualizations to the end of the list', () => {
            let state: viz.VizList = OrderedMap();

            state = viz.reducer(state, viz.createViz());
            expect(state.count()).toBe(1);
            const guid = state.keySeq().first();
            expect(guid).toBeTruthy();

            state = viz.reducer(state, viz.createViz());
            expect(state.count()).toBe(2);
            expect(state.keySeq().first()).toBe(guid);
            expect(state.keySeq().last()).not.toBe(guid);
        });

        it('should assign that visualization the next index', () => {
            let state: viz.VizList = OrderedMap();
            state = [viz.createViz(), viz.createViz()].reduce(viz.reducer, state);

            expect(state.count()).toBe(2);
            expect(state.valueSeq().map((state) => state.index).toJS()).toEqual([0, 1]);
        });
    });

    describe('delete viz', () => {
        it('should remove an element from the list', () => {
            let state: viz.VizList = OrderedMap();

            state = [viz.createViz(), viz.createViz(), viz.createViz()].reduce(viz.reducer, state);

            const guid = state.keySeq().get(1);
            state = viz.reducer(state, viz.deleteViz(guid!));
            expect(state.count()).toBe(2);
            expect(state.has(guid!)).toBeFalsy();
        })

        it('should update indices of all remaining elements', () => {
            let state: viz.VizList = OrderedMap();

            state = [viz.createViz(), viz.createViz(), viz.createViz()].reduce(viz.reducer, state);

            const guid = state.keySeq().get(1);
            state = viz.reducer(state, viz.deleteViz(guid!));
            expect(state.valueSeq().map((state) => state.index).toJS()).toEqual([0,1]);
        });
    });

    describe('sorting', () => {
        it('should move the old index to the new index', () => {
            let state: viz.VizList = OrderedMap();

            state = [viz.createViz(), viz.createViz(), viz.createViz(), viz.createViz()].reduce(viz.reducer, state);

            const guid = state.keySeq().get(1);
            const guid2 = state.keySeq().get(3);
            state = viz.reducer(state, viz.updateVizOrder(guid!, 1, 3));

            expect(state.keySeq().get(3)).toBe(guid);
            expect(state.keySeq().get(2)).toBe(guid2);
        });
    });

    describe('basic updates', () => {
        it('should set the query', () => {
            let state: viz.VizList = OrderedMap();
            state = viz.reducer(state, viz.createViz());
            const guid = state.keySeq().get(0);

            state = viz.reducer(state, viz.setVizQuery(guid!, QueryType.Event, null, 'test 1 2 3', null));
            const v = state.get(guid!)!;
            expect(v.query).toEqual({
                kind: {
                    kind: QueryType.Event,
                },
                filter: 'test 1 2 3',
                bossid: null,
            });
        });

        it('should set the vega spec', () => {
            let state: viz.VizList = OrderedMap();
            state = viz.reducer(state, viz.createViz());
            const guid = state.keySeq().get(0);

            const spec = {
                mark: 'boxplot'
            };

            state = viz.reducer(state, viz.setVizSpec(guid!, spec));
            const v = state.get(guid!)!;
            expect(v!.spec).toEqual(spec);
        });
    });
});

import { OrderedMap } from 'immutable';
import * as sec from './section';

describe('the section reducer', () => {
    describe('creation', () => {
        it('should add it to the list', () => {
            const state: sec.SectionList = OrderedMap();

            const next_state = sec.reducer(state, { type: sec.CREATE_SECTION });
            expect(next_state.count()).toBe(state.count() + 1);
        });

        it('should always add to the end', () => {
            const state: sec.SectionList = OrderedMap();

            const actions: sec.SectionAction[] = [
                { type: sec.CREATE_SECTION },
                { type: sec.CREATE_SECTION }
            ];

            const next_state = actions.reduce(sec.reducer, state);
            const ids = next_state.keySeq().toJS();
            const final_state = sec.reducer(next_state, {
                type: sec.CREATE_SECTION
            });
            expect(
                final_state
                    .keySeq()
                    .butLast()
                    .toJS()
            ).toEqual(ids);
            expect(final_state.count()).toBe(3);
        });
    });

    describe('deletion', () => {
        it('should remove exactly the requested key', () => {
            const state: sec.SectionList = OrderedMap();

            const actions: sec.SectionAction[] = [
                { type: sec.CREATE_SECTION },
                { type: sec.CREATE_SECTION },
                { type: sec.CREATE_SECTION }
            ];

            const next_state = actions.reduce(sec.reducer, state);
            const target = next_state.keySeq().get(1)!;

            expect(next_state.count()).toBe(3);
            const final_state = sec.reducer(next_state, {
                type: sec.DELETE_SECTION,
                id: target
            });

            expect(final_state.count()).toBe(2);
            expect(final_state.keySeq().toJS()).not.toContain(target);
        });

        it('should update indices', () => {
            const state: sec.SectionList = OrderedMap();

            const actions: sec.SectionAction[] = [
                { type: sec.CREATE_SECTION },
                { type: sec.CREATE_SECTION },
                { type: sec.CREATE_SECTION }
            ];

            const next_state = actions.reduce(sec.reducer, state);
            const target = next_state.keySeq().get(1)!;

            const final_state = sec.reducer(next_state, {
                type: sec.DELETE_SECTION,
                id: target
            });

            expect(
                final_state
                    .valueSeq()
                    .map(sec => sec.index)
                    .toJS()
            ).toEqual([0, 1]);
        });
    });
});

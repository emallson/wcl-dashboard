import { OrderedMap } from 'immutable';
import * as sec from './section';
import { createGuid } from './index';

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

    describe('adding visualizations', () => {
        it('should add to the end of the list by default', () => {
            let state = sec.reducer(OrderedMap(), { type: sec.CREATE_SECTION });
            const id = state.keySeq().get(0)!;

            const guids = [createGuid(), createGuid()];
            const final_state = guids.reduce(
                (state, guid) =>
                    sec.reducer(state, {
                        type: sec.SECTION_ADD_VIZ,
                        section: id,
                        viz: guid
                    }),
                state
            );

            const section = final_state.get(id)!;
            expect(section.contents.count()).toBe(2);
            expect(section.contents.toArray()).toEqual(guids);
        });

        it('should insert at specific positions when given', () => {
            let state = sec.reducer(OrderedMap(), { type: sec.CREATE_SECTION });
            const id = state.keySeq().get(0)!;

            const guids = [createGuid(), createGuid()];
            state = guids.reduce(
                (state, guid) =>
                    sec.reducer(state, {
                        type: sec.SECTION_ADD_VIZ,
                        section: id,
                        viz: guid
                    }),
                state
            );

            const target = createGuid();
            const final_state = sec.reducer(state, {
                type: sec.SECTION_ADD_VIZ,
                section: id,
                viz: target,
                position: 1
            });

            const section = final_state.get(id)!;
            expect(section.contents.count()).toBe(3);
            guids.splice(1, 0, target);
            expect(section.contents.toArray()).toEqual(guids);
        });

        it('should not add duplicate entries', () => {
            let state = sec.reducer(OrderedMap(), { type: sec.CREATE_SECTION });
            const id = state.keySeq().get(0)!;

            const guids = [createGuid(), createGuid()];
            guids.push(guids[0]);
            const final_state = guids.reduce(
                (state, guid) =>
                    sec.reducer(state, {
                        type: sec.SECTION_ADD_VIZ,
                        section: id,
                        viz: guid
                    }),
                state
            );

            const section = final_state.get(id)!;
            expect(section.contents.count()).toBe(2);
            expect(section.contents.toArray()).toEqual(guids.slice(0, 2));
        });
    });

    describe('removing visualizations', () => {
        it('should remove the viz from the list', () => {
            let state = sec.reducer(OrderedMap(), { type: sec.CREATE_SECTION });
            const id = state.keySeq().get(0)!;

            const guids = [createGuid(), createGuid()];
            state = guids.reduce(
                (state, guid) =>
                    sec.reducer(state, {
                        type: sec.SECTION_ADD_VIZ,
                        section: id,
                        viz: guid
                    }),
                state
            );

            const final_state = sec.reducer(state, {
                type: sec.SECTION_REMOVE_VIZ,
                section: id,
                viz: guids[0]
            });

            const section = final_state.get(id)!;
            expect(section.contents.count()).toBe(1);
            expect(section.contents.toArray()).toEqual([guids[1]]);
        });
    });
});

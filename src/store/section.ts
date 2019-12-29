import { OrderedMap, List } from 'immutable';
import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';
import { Guid as GuidCreator } from 'guid-typescript';

import { DashboardAction, ReportCode, Guid as VizId } from './index';

export interface SectionId
    extends Newtype<{ readonly SectionId: unique symbol }, string> {}
export const SectionId = prism<SectionId>(GuidCreator.isGuid);
export const createSectionId = () =>
    toNullable(SectionId.getOption(GuidCreator.create().toString()))!;

export type SectionList = OrderedMap<SectionId, Section>;
export const initialState: SectionList = OrderedMap();

export type Section = {
    id: SectionId;
    title: string;
    index: number;
    // if omitted, defaults to the main report code
    code: ReportCode | null;
    // visualizations can be in multiple sections at once
    contents: List<VizId>;
};

export const CREATE_SECTION = Symbol('CREATE_SECTION');
interface CreateSectionAction {
    type: typeof CREATE_SECTION;
}

export const DELETE_SECTION = Symbol('DELETE_SECTION');
interface DeleteSectionAction {
    type: typeof DELETE_SECTION;
    id: SectionId;
}

export const SET_SECTION_CODE = Symbol('SET_SECTION_CODE');
interface SetSectionCodeAction {
    type: typeof SET_SECTION_CODE;
    id: SectionId;
    code: ReportCode | null;
}

export const SET_SECTION_TITLE = Symbol('SET_SECTION_TITLE');
interface SetSectionTitleAction {
    type: typeof SET_SECTION_TITLE;
    id: SectionId;
    title: string;
}

export const SECTION_ADD_VIZ = Symbol('SECTION_ADD_VIZ');
interface SectionAddVizAction {
    type: typeof SECTION_ADD_VIZ;
    section: SectionId;
    viz: VizId;
    position?: number;
}

export const SECTION_REMOVE_VIZ = Symbol('SECTION_REMOVE_VIZ');
interface SectionRemoveVizAction {
    type: typeof SECTION_REMOVE_VIZ;
    section: SectionId;
    viz: VizId;
}

export const UPDATE_SECTION_ORDER = Symbol('UPDATE_SECTION_ORDER');
interface UpdateSectionOrderAction {
    type: typeof UPDATE_SECTION_ORDER;
    id: SectionId;
    oldIndex: number;
    newIndex: number;
}

export const UPDATE_SECTION_VIZ_ORDER = Symbol('UPDATE_SECTION_VIZ_ORDER');
interface UpdateSectionVizOrderAction {
    type: typeof UPDATE_SECTION_VIZ_ORDER;
    section: SectionId;
    viz: VizId;
    oldIndex: number;
    newIndex: number;
}

export type SectionAction =
    | CreateSectionAction
    | DeleteSectionAction
    | SetSectionCodeAction
    | SetSectionTitleAction
    | SectionAddVizAction
    | SectionRemoveVizAction
    | UpdateSectionOrderAction
    | UpdateSectionVizOrderAction;

export function reducer(
    state = initialState,
    action: DashboardAction
): SectionList {
    switch (action.type) {
        case CREATE_SECTION:
            const id = createSectionId();
            return state.set(id, {
                id,
                code: null,
                index: state.count(),
                title: 'Untitled',
                contents: List()
            });
        case DELETE_SECTION:
            let index = 0;
            return state.remove(action.id).map(sec => {
                sec.index = index++;
                return sec;
            });
        case SECTION_ADD_VIZ:
            return state.updateIn(
                [action.section, 'contents'],
                (list: List<VizId>) => {
                    if (list.contains(action.viz)) {
                        return list; // do nothing --- OrderedSet doesn't allow splicing
                    }
                    if (action.position) {
                        return list.insert(action.position, action.viz);
                    } else {
                        return list.push(action.viz);
                    }
                }
            );
        case SECTION_REMOVE_VIZ:
            return state.updateIn([action.section, 'contents'], list => {
                return list.filter((guid: VizId) => guid !== action.viz);
            });
        case SET_SECTION_CODE:
            return state.setIn([action.id, 'code'], action.code);
        case SET_SECTION_TITLE:
            return state.setIn([action.id, 'title'], action.title);
        default:
            return state;
    }
}

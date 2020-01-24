import { List } from 'immutable';
import { Newtype, prism } from 'newtype-ts';
import { toNullable } from 'fp-ts/lib/Option';
import { Guid as GuidCreator } from 'guid-typescript';

import { DashboardAction, ReportCode } from './index';

export interface SectionId
  extends Newtype<{ readonly SectionId: unique symbol }, string> {}
export const SectionId = prism<SectionId>(GuidCreator.isGuid);
export const createSectionId = () =>
  toNullable(SectionId.getOption(GuidCreator.create().toString()))!;

export type SectionList = List<Section>;
export const initialState: SectionList = List();

export type Section = {
  id: SectionId;
  title: string;
  index: number;
  // if omitted, defaults to the main report code
  code: ReportCode | null;
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

export const UPDATE_SECTION_ORDER = Symbol('UPDATE_SECTION_ORDER');
interface UpdateSectionOrderAction {
  type: typeof UPDATE_SECTION_ORDER;
  id: SectionId;
  newIndex: number;
}

export type SectionAction =
  | CreateSectionAction
  | DeleteSectionAction
  | SetSectionCodeAction
  | SetSectionTitleAction
  | UpdateSectionOrderAction;

export function reducer(
  state = initialState,
  action: DashboardAction
): SectionList {
  switch (action.type) {
    case CREATE_SECTION:
      const id = createSectionId();
      return state.push({
        id,
        code: null,
        index: state.count(),
        title: 'Untitled'
      });
    case DELETE_SECTION:
      let index = 0;
      return state
        .filter(sec => sec.id !== action.id)
        .map(sec => ({ ...sec, index: index++ }));
    case SET_SECTION_CODE:
      return state.setIn(
        [state.findIndex(sec => sec.id === action.id), 'code'],
        action.code
      );
    case SET_SECTION_TITLE:
      return state.setIn(
        [state.findIndex(sec => sec.id === action.id), 'title'],
        action.title
      );
    case UPDATE_SECTION_ORDER:
      const oldIndex = state.findIndex(sec => sec.id === action.id);
      console.log(action, state.toArray(), oldIndex);
      if (oldIndex === -1) {
        return state; // no section to move
      }
      const item = state.get(oldIndex)!;
      return state.remove(oldIndex).insert(action.newIndex, item);
    default:
      return state;
  }
}

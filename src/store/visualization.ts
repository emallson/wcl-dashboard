import { OrderedMap } from 'immutable';
import { createQueryMeta, QueryMeta } from '../query';
import { Guid, createGuid, DashboardAction } from './index';
import { SectionId, DELETE_SECTION } from './section';

export type VizState = {
  guid: Guid;
  spec: any;
  index: number;
  query: QueryMeta | null;
  section: SectionId | null;
};

export type VizList = OrderedMap<Guid, VizState>;

export const initialVizList: VizList = OrderedMap();

export const CREATE_VIZ = Symbol('CREATE_VIZ');
interface CreateVizAction {
  type: typeof CREATE_VIZ;
}

export function createViz() {
  return {
    type: CREATE_VIZ
  };
}

export const SET_VIZ_SPEC = Symbol('SET_VIZ_SPEC');
interface SetVizSpecAction {
  type: typeof SET_VIZ_SPEC;
  spec: object;
  guid: Guid;
}

export function setVizSpec(guid: Guid, spec: object) {
  return {
    type: SET_VIZ_SPEC,
    guid,
    spec
  };
}

export const SET_VIZ_QUERY = Symbol('SET_VIZ_QUERY');
interface SetVizQueryAction {
  type: typeof SET_VIZ_QUERY;
  guid: Guid;
  query: QueryMeta;
}

export function setVizQuery(
  guid: Guid,
  kind: string,
  table: string | null,
  filter: string,
  bossid: string | null,
  cutoff: number | undefined
) {
  return {
    type: SET_VIZ_QUERY,
    guid: guid,
    query: createQueryMeta(kind, table, filter, bossid, cutoff)
  };
}

export const DELETE_VIZ = Symbol('DELETE_VIZ');
interface DeleteVizAction {
  type: typeof DELETE_VIZ;
  guid: Guid;
}

export function deleteViz(guid: Guid) {
  return {
    type: DELETE_VIZ,
    guid
  };
}

export const UPDATE_VIZ_ORDER = Symbol('UPDATE_VIZ_ORDER');
interface UpdateVizOrderAction {
  type: typeof UPDATE_VIZ_ORDER;
  guid: Guid;
  oldIndex: number;
  newIndex: number;
}

export function updateVizOrder(guid: Guid, oldIndex: number, newIndex: number) {
  return {
    type: UPDATE_VIZ_ORDER,
    guid,
    oldIndex,
    newIndex
  };
}

export const DUPLICATE_VIZ = Symbol('DUPLICATE_VIZ');
interface DuplicateVizAction {
  type: typeof DUPLICATE_VIZ;
  guid: Guid;
}

export function duplicateViz(guid: Guid) {
  return {
    type: DUPLICATE_VIZ,
    guid
  };
}

export const SET_VIZ_SECTION = Symbol('SET_VIZ_SECTION');
interface SetVizSectionAction {
  type: typeof SET_VIZ_SECTION;
  guid: Guid;
  section: SectionId | null;
}

export type VizAction =
  | CreateVizAction
  | SetVizSpecAction
  | SetVizQueryAction
  | SetVizSectionAction
  | DeleteVizAction
  | UpdateVizOrderAction
  | DuplicateVizAction;

export function reducer(
  state = initialVizList,
  action: DashboardAction
): VizList {
  switch (action.type) {
    case UPDATE_VIZ_ORDER:
      let idx = 0;
      state.forEach(a => {
        a.index = idx++;
      });
      const next = state.sortBy(a => a.index);

      const direction = Math.sign(action.oldIndex - action.newIndex);
      return next
        .map(viz => {
          if (
            viz.index < Math.min(action.oldIndex, action.newIndex) ||
            viz.index > Math.max(action.oldIndex, action.newIndex)
          ) {
            return viz; // don't need to change anything
          } else if (viz.index === action.oldIndex) {
            viz.index = action.newIndex;
            return viz;
          } else {
            viz.index += direction;
            return viz;
          }
        })
        .sortBy(a => a.index);
    case CREATE_VIZ:
      const guid = createGuid();
      return state.set(guid, {
        guid,
        spec: {},
        query: null,
        section: null,
        index: state.count()
      });
    case SET_VIZ_SPEC:
      return state.setIn([action.guid, 'spec'], action.spec);
    case SET_VIZ_QUERY:
      return state.setIn([action.guid, 'query'], action.query);
    case SET_VIZ_SECTION:
      return state.setIn([action.guid, 'section'], action.section);
    case DUPLICATE_VIZ:
      const viz = state.get(action.guid)!;
      const copy: VizState = JSON.parse(JSON.stringify(viz));
      copy.guid = createGuid();
      return state.set(copy.guid, copy);
    case DELETE_VIZ:
      let index = 0;
      return state.remove(action.guid).map(viz => {
        viz.index = index++;
        return viz;
      });
    case DELETE_SECTION:
      return state.map(viz => ({ ...viz, section: null }));
    default:
      return state;
  }
}

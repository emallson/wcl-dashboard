import * as root from './index';
import { VizState } from './visualization';
import { createSectionId, CREATE_SECTION } from './section';

describe('root store', () => {
  describe('import viz', () => {
    it('should set the section field to null if it is missing', () => {
      let state = root.createState();
      const viz = {
        guid: root.createGuid()
      } as VizState;

      state = root.rootReducer(state, root.importViz(viz));

      expect(state.visualizations.get(viz.guid)!.section).toBeNull();
    });

    it('should set the section field to null if it refers to an unknown section', () => {
      let state = root.createState();
      state = root.rootReducer(state, {
        type: CREATE_SECTION
      });
      const viz = {
        guid: root.createGuid(),
        section: createSectionId()
      } as VizState;

      state = root.rootReducer(state, root.importViz(viz));

      expect(state.visualizations.get(viz.guid)!.section).toBeNull();
    });

    it('should leave the section field in place if it refers to an existing section', () => {
      let state = root.createState();
      state = root.rootReducer(state, {
        type: CREATE_SECTION
      });
      const viz = {
        guid: root.createGuid(),
        section: state.sections.get(0)!.id
      } as VizState;

      state = root.rootReducer(state, root.importViz(viz));

      expect(state.visualizations.get(viz.guid)!.section).toEqual(
        state.sections.get(0)!.id
      );
    });
  });
});

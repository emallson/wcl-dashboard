import { DashboardAction } from './index';
import { saveAs } from 'file-saver';
import { compressToBase64 } from 'lz-string';
import { VizState, VizList, initialVizList } from './visualization';

export const export_view = (state: VizState): string => {
  return compressToBase64(JSON.stringify(state));
};

export const BULK_EXPORT = Symbol('BULK_EXPORT');
export interface BulkExportAction {
  type: typeof BULK_EXPORT;
}

export function bulkExport() {
  return { type: BULK_EXPORT };
}

export function reducer(
  state = initialVizList,
  action: DashboardAction
): VizList {
  if (action.type === BULK_EXPORT) {
    const tsv = state
      .map(state => `${state.spec.title}\t${export_view(state)}`)
      .valueSeq()
      .toArray()
      .join('\n');
    saveAs(
      new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' }),
      'visualizations.tsv'
    );
  }
  return state;
}

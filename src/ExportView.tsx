import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Guid, AppState, CLOSE_EXPORT_VIEW } from './store';
import { export_view } from './store/bulk_export';

import './ExportView.scss';

type ExportViewProps = {
  guid: Guid;
};

const ExportView: React.FC<ExportViewProps> = ({ guid }) => {
  const state = useSelector(
    (state: AppState) => state.visualizations.get(guid)!
  );
  const dispatch = useDispatch();
  const value = export_view(state);
  return (
    <>
      <div id="export-background-block" />
      <div id="export-view">
        <textarea value={value} readOnly cols={80} rows={8} />
        <br />
        <button onClick={() => dispatch({ type: CLOSE_EXPORT_VIEW })}>
          OK
        </button>
      </div>
    </>
  );
};

export default ExportView;

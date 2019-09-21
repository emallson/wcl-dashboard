import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { compressToBase64 } from 'lz-string';

import { Guid, VizState, AppState, CLOSE_EXPORT_VIEW } from './store';

import './ExportView.scss';

type ExportViewProps = {
    state: VizState,
    closeExportView: () => void,
}

const ExportView: React.FC<ExportViewProps> = ({ state, closeExportView }) => {
    const value = compressToBase64(JSON.stringify(state));
    return (
        <>
            <div id="export-background-block" />
            <div id="export-view">
                <textarea value={value} readOnly cols={80} rows={8} /><br/>
                <button onClick={closeExportView} >OK</button>
            </div>
        </>
    );
};

function mapState(state: AppState, { guid }: { guid: Guid }) {
    return {
        state: state.visualizations.get(guid)!,
    };
}

function mapDispatch(dispatch: Dispatch) {
    return {
        closeExportView: () => dispatch({ type: CLOSE_EXPORT_VIEW }),
    };
}

export default connect(mapState, mapDispatch)(ExportView);

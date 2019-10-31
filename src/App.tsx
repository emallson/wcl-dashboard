import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import './App.css';
import { Guid, ReportCode, ApiKey, AppState, setMainReport, updateReport, BEGIN_IMPORT } from './store';

import { MenuBar } from './Sidebar';
import ExportView from './ExportView';
import ImportView from './ImportView';
import QueryList from './QueryList';

const MainReportCode: React.FC<{ code: ReportCode | null, setMainReport: typeof setMainReport, updateReport: typeof updateReport }> = ({ code, setMainReport, updateReport }) => {
    return (
        <div className="main-report-code-container">
            <span>Report Code: </span>
            <input type="button" style={{marginLeft: '1em'}} value="Fetch New Fights" onClick={code ? () => updateReport(code) : () => {}} />
        </div>
    );
}

type Props = {
    code: ReportCode | null,
    setMainReport: typeof setMainReport,
    updateReport: typeof updateReport,
    beginImport: () => void,
    exporting: Guid | null,
    importing: boolean,
};

const InnerApp: React.FC<Props> = (props) => {
    return (
        <>
            <MenuBar />
            <QueryList />
            { props.exporting ? <ExportView guid={props.exporting} /> : null }
            { props.importing ? <ImportView /> : null }
        </>
    );
};

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        setMainReport: (code: string | ReportCode) => dispatch(setMainReport(code)),
        updateReport: (code: ReportCode) => dispatch<any>(updateReport(code)),
        beginImport: () => dispatch({ type: BEGIN_IMPORT }),
    };
}

function mapStateToProps(state: AppState) {
    return { 
        code: state.main_report, 
        exporting: state.exporting,
        importing: state.importing,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(InnerApp);

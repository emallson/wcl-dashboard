import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import 'react-toastify/dist/ReactToastify.min.css';
import { ToastContainer } from 'react-toastify';

import './App.css';
import { Guid, ReportCode, AppState, setMainReport, updateReport, BEGIN_IMPORT } from './store';

import { MenuBar } from './Sidebar';
import ExportView from './ExportView';
import ImportView from './ImportView';
import QueryList from './QueryList';

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
            <ToastContainer
                position="top-right"
                bodyClassName="toast-text"
                autoClose={10000}
            />
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

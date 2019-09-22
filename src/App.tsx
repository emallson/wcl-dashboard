import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import './App.css';
import { Guid, ReportCode, ApiKey, AppState, setApiKey, setMainReport, updateReport, BEGIN_IMPORT } from './store';

import ExportView from './ExportView';
import ImportView from './ImportView';
import QueryList from './QueryList';

const DemandApiKey: React.FC<{ setApiKey: (key: string) => void }> = ({ setApiKey }) => {
    return (
        <div className="App">
            <span>Before continuing, please input your WCL Public API Key: </span>
            <input type="text" id="api_key_input" />
            <input type="button" value="OK" onClick={() => {
                const el = document.getElementById("api_key_input")! as HTMLInputElement;
                const key = el.value;
                setApiKey(key);
            }} />
        </div>
    )
};

const MainReportCode: React.FC<{ code: ReportCode | null, setMainReport: typeof setMainReport, updateReport: typeof updateReport }> = ({ code, setMainReport, updateReport }) => {
    return (
        <div className="main-report-code-container">
            <span>Report Code: </span>
            <input type="text" defaultValue={code ? code.toString() : ''} onChange={(e) => setMainReport(e.target.value)} />
            <input type="button" style={{marginLeft: '1em'}} value="Fetch New Fights" onClick={code ? () => updateReport(code) : () => {}} />
        </div>
    );
}

type Props = {
    api_key: ApiKey | null,
    code: ReportCode | null,
    setApiKey: typeof setApiKey,
    setMainReport: typeof setMainReport,
    updateReport: typeof updateReport,
    beginImport: () => void,
    exporting: Guid | null,
    importing: boolean,
};

const InnerApp: React.FC<Props> = (props) => {
    if (props.api_key === null) {
        return <DemandApiKey setApiKey={props.setApiKey} />;
    } else {
        return (
            <>
                <MainReportCode code={props.code} setMainReport={props.setMainReport} updateReport={props.updateReport} />
                <QueryList />
                { props.exporting ? <ExportView guid={props.exporting} /> : null }
                { props.importing ? <ImportView /> : null }
                <button id="btn-import" onClick={props.beginImport}>Import</button>
            </>
        );
    }
};

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        setApiKey: (key: string | ApiKey) => dispatch(setApiKey(key)),
        setMainReport: (code: string | ReportCode) => dispatch(setMainReport(code)),
        updateReport: (code: ReportCode) => dispatch<any>(updateReport(code)),
        beginImport: () => dispatch({ type: BEGIN_IMPORT }),
    };
}

function mapStateToProps(state: AppState) {
    return { 
        api_key: state.api_key,
        code: state.main_report, 
        exporting: state.exporting,
        importing: state.importing,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(InnerApp);

import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import './App.css';
import { ReportCode, ApiKey, AppState, VizState, createViz, setVizSpec, setApiKey, setMainReport, updateReport } from './store';
import { Guid } from 'guid-typescript';
import { Vega } from 'react-vega';


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

const QueryViz: React.FC<{ state: VizState, setSpec: typeof setVizSpec }> = ({ state, setSpec }) => {
    return (
        <div className="query-viz">
            <textarea id={`spec-${state.guid.toString()}`} rows={20} defaultValue={JSON.stringify(state.spec)} />
            <input type="button" value="Update" onClick={() => {
                const el = document.getElementById(`spec-${state.guid.toString()}`)! as HTMLTextAreaElement;
                setSpec(state.guid, el.value);
            }} />
            <Vega spec={state.spec} data={[]} />
        </div>
    )
};

const Queries: React.FC<{ states: readonly VizState[], setSpec: typeof setVizSpec, create: typeof createViz }> = ({ states, setSpec, create }) => {
    return (
        <div className="query-container">
            <div className="query-list">
                {states.map(state => <QueryViz key={state.guid.toString()} state={state} setSpec={setSpec} />)}
            </div>
            <input type="button" value="Create" onClick={create} />
        </div>
    );
}

const MainReportCode: React.FC<{ code: ReportCode | null, setMainReport: typeof setMainReport, updateReport: typeof updateReport }> = ({ code, setMainReport, updateReport }) => {
    return (
        <div className="main-report-code-container">
            <span>Report Code: </span>
            <input type="text" defaultValue={code ? code.toString() : ''} onChange={(e) => setMainReport(e.target.value)} />
            <input type="button" value="Update" onClick={code ? () => updateReport(code) : () => {}} />
        </div>
    );
}

type Props = {
    api_key: ApiKey | null,
    code: ReportCode | null,
    setApiKey: typeof setApiKey,
    states: readonly VizState[],
    createViz: typeof createViz,
    setVizSpec: typeof setVizSpec,
    setMainReport: typeof setMainReport,
    updateReport: typeof updateReport,
};

const InnerApp: React.FC<Props> = (props) => {
    if (props.api_key === null) {
        return <DemandApiKey setApiKey={props.setApiKey} />;
    } else {
        return (
            <>
                <MainReportCode code={props.code} setMainReport={props.setMainReport} updateReport={props.updateReport} />
                <Queries states={props.states} setSpec={props.setVizSpec} create={props.createViz} />
            </>
        );
    }
};

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        setApiKey: (key: string | ApiKey) => dispatch(setApiKey(key)),
        setVizSpec: (guid: Guid, spec: string | object) => dispatch(setVizSpec(guid, spec)),
        createViz: () => dispatch(createViz()),
        setMainReport: (code: string | ReportCode) => dispatch(setMainReport(code)),
        updateReport: (code: ReportCode) => dispatch<any>(updateReport(code)),
    };
}

function mapStateToProps({ api_key, main_report, visualizations }: AppState) {
    return { 
        api_key,
        code: main_report, 
        states: visualizations.valueSeq().toArray() 
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(InnerApp);

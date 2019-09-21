import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { queryData, QueryVizData } from './query';
import { hasReportMeta, ReportCode, VizState, Guid, AppState, setVizSpec, } from './store';
import Vega from './vega';
import QueryBuilder from './QueryBuilder';
import { VisualizationSpec } from 'vega-embed';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import AceEditor from 'react-ace';

import './QueryViz.scss';

type QueryVizProps = { 
    state: VizState, 
    setSpec: typeof setVizSpec, 
    data: QueryVizData | undefined
};

type QueryVizState = {
    flipped: boolean;
    specString: string;
}

class QueryViz extends React.Component<QueryVizProps, QueryVizState> {
    constructor(props: QueryVizProps) {
        super(props);

        this.state = { flipped: !props.data, specString: JSON.stringify(props.state.spec, null, 2) };
    }

    flip() {
        this.setState({ ...this.state, flipped: !this.state.flipped });
    }

    updateNextSpec(newValue: string) {
        this.setState({ ...this.state, specString: newValue });
    }

    render() {
        const { state, data, setSpec } = this.props;
        const spec = { ...state.spec, data } as VisualizationSpec;
        console.log(spec);

        if(this.state.flipped) {
            return (
                <div className="query-viz">
                    <div onClick={this.flip.bind(this)}>View</div>
                    <QueryBuilder guid={state.guid} />
                    <AceEditor
                        value={this.state.specString} 
                        onChange={this.updateNextSpec.bind(this)}
                        theme="solarized_light"
                        mode="json"
                    />
                    <input type="button" value="Update" onClick={() => {
                        setSpec(state.guid, this.state.specString);
                    }} />
                </div>
            );
        } else {
            return (
                <div className="query-viz">
                    <div onClick={this.flip.bind(this)}>Configure</div>
                    {data ? <Vega spec={spec} /> : <span style={{margin: '2em', padding: '2em'}}>Missing Data</span>}
                </div>
            );
        }

    }
}

const mapState = (state: AppState, { code, guid }: { code: ReportCode | null, guid: Guid }) => {
    const vizState = state.visualizations.get(guid)!;
    return {
        state: vizState,
        data: (code && hasReportMeta(state, code) && vizState.query) ? queryData(vizState.query, code, state) : undefined,
    };
};

const mapDispatch = (dispatch: Dispatch) => {
    return {
        setSpec: (guid: Guid, spec: string | object) => dispatch(setVizSpec(guid, spec)),
    };
}

export default connect(mapState, mapDispatch)(QueryViz);

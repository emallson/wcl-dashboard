import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { queryData, QueryVizData } from './query';
import { exportViz, deleteViz, hasReportMeta, ReportCode, VizState, Guid, AppState, setVizSpec, } from './store';
import Vega, { VisualizationSpec, EmbedOptions } from './vega';
import QueryBuilder from './QueryBuilder';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import AceEditor from 'react-ace';

import './QueryViz.scss';

type QueryVizProps = { 
    state: VizState, 
    setSpec: typeof setVizSpec, 
    deleteViz: typeof deleteViz,
    exportViz: typeof exportViz,
    data: QueryVizData | undefined
};

type QueryVizState = {
    flipped: boolean;
    menu: boolean;
    specString: string;
}

const emSize = Number(getComputedStyle(document.body,null)!.fontSize!.replace(/[^\d]/g, ''));

const vega_config = {
    axis: {
        labelFont: "Linux Libertine",
        labelFontSize: 0.8 * emSize,
        titleFont: "Linux Libertine",
        titleFontSize: 1 * emSize,
    },
    legend: {
        labelFont: "Linux Libertine",
        labelFontSize: 0.8 * emSize,
        titleFont: "Linux Libertine",
        titleFontSize: 0.8 * emSize,
    },
    title: {
        font: 'Linux Libertine',
        fontSize: 1.2 * emSize,
    },
};

const vega_options: EmbedOptions = {
    renderer: 'canvas',
    config: vega_config,
};

class QueryViz extends React.Component<QueryVizProps, QueryVizState> {
    constructor(props: QueryVizProps) {
        super(props);

        this.state = { 
            flipped: !props.data, 
            menu: false,
            specString: JSON.stringify(props.state.spec, null, 2) 
        };
    }

    flip() {
        this.setState({ ...this.state, flipped: !this.state.flipped });
    }

    menu() {
        this.setState({ menu: !this.state.menu });
    }

    updateNextSpec(newValue: string) {
        this.setState({ ...this.state, specString: newValue });
    }

    render() {
        const { state, data, setSpec, exportViz, deleteViz } = this.props;
        const spec = { ...state.spec, data } as VisualizationSpec;
        console.log(spec);

        if(this.state.flipped) {
            return (
                <div className="query-viz">
                    <div className="menuBar">
                        <div onClick={this.flip.bind(this)}>View</div>
                        <div className="dropdown">
                            <div onClick={this.menu.bind(this)}>...</div>
                            { this.state.menu ?
                                (
                                    <div className="dropdown-content">
                                        <div onClick={() => { exportViz(state.guid); this.menu(); }}>Export</div>
                                        <div onClick={() => deleteViz(state.guid)}>Delete</div>
                                    </div>
                            ) : null }
                        </div>
                    </div>
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
                    {data ? <Vega spec={spec} options={vega_options}/> : <span style={{margin: '2em', padding: '2em'}}>Missing Data</span>}
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
        deleteViz: (guid: Guid) => dispatch(deleteViz(guid)),
        exportViz: (guid: Guid) => dispatch(exportViz(guid)),
    };
}

export default connect(mapState, mapDispatch)(QueryViz);

import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { queryKey, getDataById, QueryMeta, QueryVizData, queryDataChanged } from './query';
import { exportViz, deleteViz, hasReportMeta, ReportCode, VizState, Guid, AppState, setVizSpec, } from './store';
import Vega, { VisualizationSpec, EmbedOptions } from './vega';
import QueryBuilder from './QueryBuilder';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import AceEditor from 'react-ace';
import { SortableHandle, SortableElement } from 'react-sortable-hoc';
import equal from 'fast-deep-equal';

import './QueryViz.scss';
import './grip.css';

type QueryVizProps = { 
    state: VizState, 
    setSpec: typeof setVizSpec, 
    deleteViz: typeof deleteViz,
    exportViz: typeof exportViz,
    data_indices: number[] | null
};

type QueryVizState = {
    flipped: boolean;
    menu: boolean;
    specString: string;
    data: QueryVizData | null;
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

const Handle = SortableHandle(() => {
    return (
        <span className="grippy" style={{marginRight: 8}}></span>
    );
});

class QueryViz extends React.Component<QueryVizProps, QueryVizState> {
    static whyDidYouRender = true;

    constructor(props: QueryVizProps) {
        super(props);

        this.state = { 
            flipped: false,
            menu: false,
            specString: JSON.stringify(props.state.spec, null, 2),
            data: null,
        };
    }

    shouldComponentUpdate(nextProps: QueryVizProps, nextState: QueryVizState) {
        if(!equal(nextProps, this.props)) {
            return true;
        } else if(this.state.data === null && !equal(nextState, this.state)) {
            return true;
        } else if(nextState.data !== null && this.state.data !== null) {
            return queryDataChanged(nextState.data, this.state.data);
        }

        return !equal({ ...nextState, data: null }, { ...this.state, data: null });
    }

    _updateData() {
        if(this.props.data_indices !== null) {
            getDataById(this.props.data_indices)
                .then((data) => this.setState({
                    data: {
                        name: 'data',
                        values: data.filter((datum) => datum !== undefined)
                        .reduce((result, datum) => result.concat(datum!.values), [] as any[])
                    }
                }))
                .catch((err) => console.error(err));
        }
    }

    componentDidMount() {
        this._updateData();
    }

    componentDidUpdate(prevProps: QueryVizProps) {
        if(!equal(this.props.data_indices, prevProps.data_indices)) {
            this._updateData();
        }
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
        console.log(this.props);
        const { state, setSpec, exportViz, deleteViz } = this.props;
        const { data } = this.state;
        const spec = { ...state.spec, data } as VisualizationSpec;
        console.log(spec);

        if(this.state.flipped) {
            return (
                <div className="query-viz">
                    <div className="menuBar">
                        <Handle />
                        <span onClick={this.flip.bind(this)}>View</span>
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
                        tabSize={2}
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
                    <div className="menuBar">
                        <Handle />
                        <span onClick={this.flip.bind(this)}>Configure</span>
                    </div>
                    {data ? <Vega spec={spec} options={vega_options}/> : <span style={{margin: '2em', padding: '2em'}}>Missing Data</span>}
                </div>
            );
        }

    }
}

function getDataIndices(state: AppState, code: ReportCode | null, query: QueryMeta | null): number[] | null {
    if(code && hasReportMeta(state, code) && query) {
        const indices = state.reports.getIn([code, 'queries', queryKey(query)]);
        if(indices) {
            return indices.valueSeq().toArray();
        }
    }
    return null;
}

const mapState = (state: AppState, { code, guid }: { code: ReportCode | null, guid: Guid }) => {
    const vizState = state.visualizations.get(guid)!;
    return {
        state: vizState,
        data_indices: getDataIndices(state, code, vizState.query),
    };
};

const mapDispatch = (dispatch: Dispatch) => {
    return {
        setSpec: (guid: Guid, spec: string | object) => dispatch(setVizSpec(guid, spec)),
        deleteViz: (guid: Guid) => dispatch(deleteViz(guid)),
        exportViz: (guid: Guid) => dispatch(exportViz(guid)),
    };
}

export default connect(mapState, mapDispatch)(SortableElement(QueryViz));

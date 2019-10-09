import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { queryKey, getDataById, QueryMeta, QueryVizData, relevantFights, missingFights, queryDataChanged } from './query';
import { clearQueryIndex, exportViz, deleteViz, hasReportMeta, ReportCode, VizState, Guid, AppState, setVizSpec, } from './store';
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
    clearQueryIndex: typeof clearQueryIndex,
    data_indices: number[] | null
};

type QueryVizState = {
    flipped: boolean;
    menu: boolean;
    specString: string;
    data: QueryVizData | null;
    renderError: any;
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
            renderError: null,
        };
    }

    shouldComponentUpdate(nextProps: QueryVizProps, nextState: QueryVizState) {
        if(!equal(nextProps, this.props)) {
            return true;
        } else if((nextState.data === null || this.state.data === null) && !equal(nextState, this.state)) {
            return true;
        } else if(nextState.data !== null && this.state.data !== null) {
            return queryDataChanged(nextState.data, this.state.data) || !equal({ ...nextState, data: null }, { ...this.state, data: null });
        }

        return !equal({ ...nextState, data: null }, { ...this.state, data: null });
    }

    _updateData() {
        if(this.props.data_indices !== null) {
            getDataById(this.props.data_indices)
                .then((data) => {
                    const present_ids = data.filter(datum => datum !== undefined).map(datum => datum!.id);
                    const missing_data = this.props.data_indices!.filter(id => !present_ids.includes(id));
                    if(missing_data.length > 0) {
                        this.props.clearQueryIndex(missing_data);
                    }
                    this.setState({
                        data: {
                            name: 'data',
                            values: data.filter((datum) => datum !== undefined)
                            .reduce((result, datum) => result.concat(datum!.data.values), [] as any[])
                        }
                    });
                })
                .catch((err) => console.error(err));
        }
    }

    componentDidMount() {
        this._updateData();
    }

    componentDidUpdate(prevProps: QueryVizProps) {
        if(!equal(this.props.data_indices, prevProps.data_indices)) {
            this.setState({ data: null });
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

    renderError(error: any) {
        this.setState({ renderError: error });
    }

    render() {
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
                        this.renderError(null); // clear the error if it exists
                        setSpec(state.guid, this.state.specString);
                    }} />
                </div>
            );
        } else {
            const vega = <Vega spec={spec} options={vega_options} renderError={this.renderError.bind(this)} />

            let display = null;
            if(this.state.renderError) {
                display = <>
                    <span style={{margin: '2em', padding: '2em'}}>Unable to render graphic: {this.state.renderError.message}</span>
                </>;
            } else {
                display = 
                    (data && data.values.length > 0) ? vega : <span style={{margin: '2em', padding: '2em'}}>Missing Data</span>;
            }
            return (
                <div className="query-viz">
                    <div className="menuBar">
                        <Handle />
                        <span onClick={this.flip.bind(this)}>Configure</span>
                    </div>
                    {display}
                </div>
            );
        }

    }
}

function getDataIndices(state: AppState, code: ReportCode | null, query: QueryMeta | null): number[] | null {
    if(code && hasReportMeta(state, code) && query) {
        if(missingFights(query, code, state).length > 0) {
            return null; // don't show anything if we are missing data
        }
        const relevant_fights = relevantFights(query, code, state);
        const indices = state.reports.getIn([code, 'queries', queryKey(query)]);
        if(indices) {
            return indices.filter((_: any, fid: string) => relevant_fights.includes(parseInt(fid))).valueSeq().toArray();
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
        clearQueryIndex: (index: number[]) => dispatch(clearQueryIndex(index)),
    };
}

export default connect(mapState, mapDispatch)(SortableElement(QueryViz));

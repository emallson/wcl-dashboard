import React, { useState } from 'react';
import { Dispatch } from 'redux';
import { connect, useDispatch } from 'react-redux';

import { queryKey, getDataById, QueryMeta, QueryVizData, relevantFights, missingFights, queryDataChanged } from './query';
import { clearQueryIndex, exportViz, hasReportMeta, ReportCode, Guid, AppState, } from './store';
import { deleteViz, VizState, setVizSpec } from './store/visualization';
import Vega, { VisualizationSpec, EmbedOptions } from './vega';
import QueryBuilder from './QueryBuilder';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import AceEditor from 'react-ace';
import { SortableHandle, SortableElement } from 'react-sortable-hoc';
import GridLoader from 'react-spinners/GridLoader';
import equal from 'fast-deep-equal';

import './QueryViz.scss';
import './grip.css';

type QueryVizProps = { 
    state: VizState, 
    clearQueryIndex: typeof clearQueryIndex,
    data_indices: number[] | null
    external_load: boolean,
};

type QueryVizState = {
    flipped: boolean;
    data: QueryVizData | null;
    loading: boolean;
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

const QueryView: React.FC<{data: any, spec: any, loading: boolean, flip: () => void}> = ({data, spec, loading, flip}) => {
    const [renderError, setRenderError] = useState<any>(null);
    const vega = <Vega spec={spec} options={vega_options} renderError={setRenderError} />

    let display = null;
    if(renderError) {
        display = <>
            <span style={{margin: '2em', padding: '2em'}}>Unable to render graphic: {renderError!.message}</span>
        </>;
    } else {
        display = 
            (data && data.values.length > 0) ? vega : <span style={{margin: '2em', padding: '2em'}}>Missing Data</span>;
    }
    return (
        <>
            <div className="menuBar">
                <Handle />
                <span onClick={flip}>Configure</span>
            </div>
            <GridLoader css="margin: 1em auto;" color="#657b83" loading={loading} />
            {display}
        </>
    );
};

const QueryEditor: React.FC<{flip: () => void, state: VizState}> = ({flip, state}) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [specString, setSpecString] = useState(JSON.stringify(state.spec, null, 2));
    const dispatch = useDispatch();

    return (
        <>
            <div className="menuBar">
                <Handle />
                <span onClick={flip}>View</span>
                <div className="dropdown">
                    <div onClick={() => setMenuVisible(!menuVisible)}>...</div>
                    { menuVisible ?
                        (
                            <div className="dropdown-content">
                                <div onClick={() => { dispatch(exportViz(state.guid)); setMenuVisible(false); }}>Export</div>
                                <div onClick={() => dispatch(deleteViz(state.guid))}>Delete</div>
                            </div>
                    ) : null }
                </div>
            </div>
            <QueryBuilder guid={state.guid} />
            <AceEditor
                value={specString} 
                onChange={setSpecString}
                tabSize={2}
                theme="solarized_light"
                mode="json"
            />
            <input type="button" value="Update" onClick={() => {
                dispatch(setVizSpec(state.guid, specString));
            }} />
        </>
    );
};

class QueryViz extends React.Component<QueryVizProps, QueryVizState> {

    constructor(props: QueryVizProps) {
        super(props);

        this.state = { 
            flipped: false,
            data: null,
            loading: false,
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
            this.setState({ loading: true });
            getDataById(this.props.data_indices)
                .then((data) => {
                    const present_ids = data.filter(datum => datum !== undefined).map(datum => datum!.id);
                    const missing_data = this.props.data_indices!.filter(id => !present_ids.includes(id));
                    if(missing_data.length > 0) {
                        this.props.clearQueryIndex(missing_data);
                    }
                    this.setState({
                        loading: false,
                        data: {
                            name: 'data',
                            values: data.filter((datum) => datum !== undefined)
                            .reduce((result, datum) => result.concat(datum!.data.values), [] as any[])
                        }
                    });
                })
                .catch((err) => {
                    console.error(err)
                    this.setState({ loading: false });
                });
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
        this.setState({ flipped: !this.state.flipped });
    }

    render() {
        const { state } = this.props;
        const { data } = this.state;
        const spec = { ...state.spec, data } as VisualizationSpec;
        console.log(spec);

        if(this.state.flipped) {
            return (
                <div className="query-viz">
                    <QueryEditor flip={this.flip.bind(this)} state={state} />
                </div>
            );
        } else {
            return (
                <div className="query-viz">
                    <QueryView data={data} spec={spec} loading={this.state.loading || this.props.external_load} flip={this.flip.bind(this)} />
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
        external_load: !!vizState.query && !!state.requests.queries.find((val) => val.includes(queryKey(vizState.query!).toString())),
    };
};

const mapDispatch = (dispatch: Dispatch) => {
    return {
        clearQueryIndex: (index: number[]) => dispatch(clearQueryIndex(index)),
    };
}

export default connect(mapState, mapDispatch)(SortableElement(QueryViz));

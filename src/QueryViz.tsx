import React, { useState } from 'react';
import { Dispatch } from 'redux';
import { connect, useDispatch } from 'react-redux';
import { Event, TableEntry } from './query';
import * as eventTransforms from './event_transforms';

import {
  queryKey,
  getDataById,
  QueryMeta,
  QueryVizData,
  relevantFights,
  missingFights,
  queryDataChanged
} from './query';
import {
  clearQueryIndex,
  exportViz,
  hasReportMeta,
  ReportCode,
  ReportState,
  Guid,
  AppState
} from './store';
import {
  duplicateViz,
  deleteViz,
  VizState,
  setVizSpec
} from './store/visualization';
import Vega, { VisualizationSpec, EmbedOptions } from './vega';
import QueryBuilder from './QueryBuilder';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import AceEditor from 'react-ace';
import { SortableHandle, SortableElement } from 'react-sortable-hoc';
import GridLoader from 'react-spinners/GridLoader';
import equal from 'fast-deep-equal';
import { notify_error } from './notify';

import './QueryViz.scss';
import './grip.css';

type QueryVizProps = {
  report: ReportState | null;
  state: VizState;
  clearQueryIndex: typeof clearQueryIndex;
  data_indices: number[] | null;
  external_load: boolean;
};

type QueryVizState = {
  flipped: boolean;
  data: QueryVizData | null;
  loading: boolean;
};

const emSize = Number(
  getComputedStyle(document.body, null)!.fontSize!.replace(/[^\d]/g, '')
);

const vega_config = {
  axis: {
    labelFont: 'Linux Libertine',
    labelFontSize: 0.8 * emSize,
    titleFont: 'Linux Libertine',
    titleFontSize: 1 * emSize
  },
  legend: {
    labelFont: 'Linux Libertine',
    labelFontSize: 0.8 * emSize,
    titleFont: 'Linux Libertine',
    titleFontSize: 0.8 * emSize
  },
  title: {
    font: 'Linux Libertine',
    fontSize: 1.2 * emSize
  }
};

const vega_options: EmbedOptions = {
  renderer: 'canvas',
  config: vega_config
};

const Handle = SortableHandle(() => {
  return <span className="grippy" style={{ marginRight: 8 }}></span>;
});

const view_msg_style = { margin: '2em' };
const title_style = {
  fontSize: '1.2em',
  fontWeight: 700,
  fontFamily: 'Linux Libertine',
  color: 'black',
  display: 'inline-block',
  paddingTop: '0.5em',
  paddingBottom: '0.5em'
};

const defaultSpec = {
  background: '#fdf6e3'
};

export const QueryView: React.FC<{
  data: any;
  spec: any;
  loading: boolean;
  flip: () => void;
}> = ({ data, spec, loading, flip }) => {
  const [renderError, setRenderError] = useState<any>(null);

  const vega = (
    <Vega
      spec={{
        ...defaultSpec,
        ...spec
      }}
      options={vega_options}
      renderError={setRenderError}
    />
  );

  let display = null;
  if (renderError) {
    display = (
      <>
        <span style={view_msg_style}>
          Unable to render graphic: {renderError!.message}
        </span>
      </>
    );
  } else if (loading) {
    display = <span style={view_msg_style}>Loading data...</span>;
  } else if (!data) {
    display = <span style={view_msg_style}>Missing Data</span>;
  } else if (data.values.length === 0) {
    display = <span style={view_msg_style}>No Relevant Data in Log</span>;
  } else {
    display = vega;
  }

  return (
    <>
      <div className="menuBar">
        <Handle />
        <span onClick={flip}>Configure</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        {display === vega || spec.title === undefined ? null : (
          <>
            <span style={title_style}>{spec.title}</span>
            <br />
          </>
        )}
        {process.env.JEST_WORKER_ID !== undefined ? null : (
          <GridLoader
            css="margin: 1em auto;"
            color="#657b83"
            loading={loading}
          />
        )}
        {display}
      </div>
    </>
  );
};

const safeSetSpec = (guid: Guid, spec: string, dispatch: Dispatch) => {
  try {
    dispatch(setVizSpec(guid, JSON.parse(spec)));
    return true;
  } catch (err) {
    notify_error(err.message);
    return false;
  }
};

export const QueryEditor: React.FC<{ flip: () => void; state: VizState }> = ({
  flip,
  state
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [specString, setSpecString] = useState(
    JSON.stringify(state.spec, null, 2)
  );
  const dispatch = useDispatch();

  return (
    <>
      <div className="menuBar">
        <Handle />
        <span
          onClick={() => {
            safeSetSpec(state.guid, specString, dispatch) && flip();
          }}
        >
          View
        </span>
        <div className="dropdown">
          <div onClick={() => setMenuVisible(!menuVisible)}>...</div>
          {menuVisible ? (
            <div className="dropdown-content">
              <div
                onClick={() => {
                  dispatch(duplicateViz(state.guid));
                  setMenuVisible(false);
                }}
              >
                Copy
              </div>
              <div
                onClick={() => {
                  dispatch(exportViz(state.guid));
                  setMenuVisible(false);
                }}
              >
                Export
              </div>
              <div onClick={() => dispatch(deleteViz(state.guid))}>Delete</div>
            </div>
          ) : null}
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
      <input
        type="button"
        value="Update"
        onClick={() => {
          safeSetSpec(state.guid, specString, dispatch);
        }}
      />
    </>
  );
};

class QueryViz extends React.Component<QueryVizProps, QueryVizState> {
  constructor(props: QueryVizProps) {
    super(props);

    this.state = {
      flipped: false,
      data: null,
      loading: false
    };
  }

  shouldComponentUpdate(nextProps: QueryVizProps, nextState: QueryVizState) {
    if (!equal(nextProps, this.props)) {
      return true;
    } else if (
      (nextState.data === null || this.state.data === null) &&
      !equal(nextState, this.state)
    ) {
      return true;
    } else if (nextState.data !== null && this.state.data !== null) {
      return (
        queryDataChanged(nextState.data, this.state.data) ||
        !equal({ ...nextState, data: null }, { ...this.state, data: null })
      );
    }

    return !equal({ ...nextState, data: null }, { ...this.state, data: null });
  }

  _updateData() {
    if (this.props.data_indices !== null) {
      this.setState({ loading: true });
      getDataById(this.props.data_indices)
        .then(data => {
          const present_ids = data
            .filter(datum => datum !== undefined)
            .map(datum => datum!.id);
          const missing_data = this.props.data_indices!.filter(
            id => !present_ids.includes(id)
          );
          if (missing_data.length > 0) {
            this.props.clearQueryIndex(missing_data);
          }

          let values = data
            .filter(datum => datum !== undefined)
            .reduce(
              (result, datum) => result.concat(datum!.data.values),
              [] as any[]
            );

          if('timestamp' in values[0]) {
            values = (values as Event[]).map(event => Object.values(eventTransforms).reduce((val, fn) => fn(val, this.props.report!), event));
          } else {
            values = values as TableEntry[];
          }
          this.setState({
            loading: false,
            data: {
              name: 'data',
              values
            }
          });
        })
        .catch(err => {
          console.error(err);
          this.setState({ loading: false });
        });
    }
  }

  componentDidMount() {
    this._updateData();
  }

  componentDidUpdate(prevProps: QueryVizProps) {
    if (!equal(this.props.data_indices, prevProps.data_indices)) {
      this.setState({ data: null });
      this._updateData();
    }
  }

  flip() {
    this.setState({ flipped: !this.state.flipped });
  }

  render() {
    const { state, report } = this.props;
    const { data } = this.state;
    const spec = { ...defaultSpec, datasets: {}, ...state.spec, data };
    spec.datasets = {
      enemies: report ? report.enemies : [],
      friendlies: report ? report.friendlies : [],
      fights: report ? report.fights : [],
      ...spec.datasets,
    };
    console.log(spec);

    if (this.state.flipped) {
      return (
        <div className="query-viz">
          <QueryEditor flip={this.flip.bind(this)} state={state} />
        </div>
      );
    } else {
      return (
        <div className="query-viz">
          <QueryView
            data={data}
            spec={spec as VisualizationSpec}
            loading={this.state.loading || this.props.external_load}
            flip={this.flip.bind(this)}
          />
        </div>
      );
    }
  }
}

function getDataIndices(
  state: AppState,
  code: ReportCode | null,
  query: QueryMeta | null
): number[] | null {
  if (code && hasReportMeta(state, code) && query) {
    if (missingFights(query, code, state).length > 0) {
      return null; // don't show anything if we are missing data
    }
    const relevant_fights = relevantFights(query, code, state);
    const indices = state.reports.getIn([code, 'queries', queryKey(query)]);
    if (indices) {
      return indices
        .filter((_: any, fid: string) =>
          relevant_fights.includes(parseInt(fid))
        )
        .valueSeq()
        .toArray();
    }
  }
  return null;
}

const mapState = (
  state: AppState,
  { code, guid }: { code: ReportCode | null; guid: Guid }
) => {
  const vizState = state.visualizations.get(guid)!;
  return {
    report: code ? state.reports.get(code)! : null,
    state: vizState,
    data_indices: getDataIndices(state, code, vizState.query),
    external_load:
      !!vizState.query &&
      !!state.requests.queries.find(val =>
        val.includes(queryKey(vizState.query!).toString())
      )
  };
};

const mapDispatch = (dispatch: Dispatch) => {
  return {
    clearQueryIndex: (index: number[]) => dispatch(clearQueryIndex(index))
  };
};

export default connect(mapState, mapDispatch)(SortableElement(QueryViz));

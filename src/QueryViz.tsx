import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { Event, TableEntry } from './query';
import * as eventTransforms from './event_transforms';
import { useDrag, useDrop } from 'react-dnd';

import {
  queryKey,
  getDataById,
  QueryMeta,
  QueryVizData,
  relevantFights,
  missingFights
  // queryDataChanged
} from './query';
import {
  clearQueryIndex,
  exportViz,
  hasReportMeta,
  ReportCode,
  Guid,
  AppState
} from './store';
import {
  duplicateViz,
  deleteViz,
  VizState,
  setVizSpec,
  updateVizOrder
} from './store/visualization';
import { SectionId } from './store/section';
import Vega, { VisualizationSpec, EmbedOptions } from './vega';
import QueryBuilder from './QueryBuilder';
import 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import AceEditor from 'react-ace';
import GridLoader from 'react-spinners/GridLoader';
// import equal from 'fast-deep-equal';
import { notify_error } from './notify';

import './QueryViz.scss';
import './grip.css';

export const VIZ_DRAG_TYPE = 'VIZ_DRAG_TYPE';

type QueryVizProps = {
  guid: Guid;
  code: ReportCode | null;
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

export const Handle = ({ dragRef }: { dragRef: any }) => {
  return (
    <span ref={dragRef} className="grippy" style={{ marginRight: 8 }}></span>
  );
};

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
  dragRef: any;
  data: any;
  spec: any;
  loading: boolean;
  flip: () => void;
}> = ({ dragRef, data, spec, loading, flip }) => {
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
        <Handle dragRef={dragRef} />
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

export const QueryEditor: React.FC<{
  dragRef: any;
  flip: () => void;
  state: VizState;
}> = ({ dragRef, flip, state }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [specString, setSpecString] = useState(
    JSON.stringify(state.spec, null, 2)
  );
  const dispatch = useDispatch();

  return (
    <>
      <div className="menuBar">
        <Handle dragRef={dragRef} />
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

/*
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
*/

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

export interface DragItem {
  type: typeof VIZ_DRAG_TYPE;
  id: Guid;
  originalSection: SectionId;
  originalIndex: number;
}

const QueryViz: React.FC<QueryVizProps> = props => {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QueryVizData | null>(null);
  const dispatch = useDispatch();

  const state = useSelector(
    (state: AppState) => state.visualizations.get(props.guid)!
  );
  const report = useSelector((state: AppState) =>
    props.code ? state.reports.get(props.code) : null
  );
  const data_indices = useSelector((appState: AppState) =>
    getDataIndices(appState, props.code, state.query)
  );
  const external_load = useSelector(
    (appState: AppState) =>
      !!state.query &&
      !!appState.requests.queries.find(val =>
        val.includes(queryKey(state.query!).toString())
      )
  );

  useEffect(() => {
    if (data_indices !== null) {
      setLoading(true);
      getDataById(data_indices)
        .then(data => {
          const present_ids = data
            .filter(datum => datum !== undefined)
            .map(datum => datum!.id);
          const missing_data = data_indices!.filter(
            id => !present_ids.includes(id)
          );
          if (missing_data.length > 0) {
            dispatch(clearQueryIndex(missing_data));
          }

          let values = data
            .filter(datum => datum !== undefined)
            .reduce(
              (result, datum) => result.concat(datum!.data.values),
              [] as any[]
            );

          if ('timestamp' in values[0]) {
            values = (values as Event[]).map(event =>
              Object.values(eventTransforms).reduce(
                (val, fn) => fn(val, report!),
                event
              )
            );
          } else {
            values = values as TableEntry[];
          }
          setLoading(false);
          setData({
            name: 'data',
            values
          });
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [report, data_indices, dispatch]);

  const spec = { ...defaultSpec, datasets: {}, ...state.spec, data };
  spec.datasets = {
    enemies: report ? report.enemies : [],
    friendlies: report ? report.friendlies : [],
    fights: report ? report.fights : [],
    ...spec.datasets
  };
  console.log(spec);

  const flip = useCallback(() => setFlipped(!flipped), [flipped]);

  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      id: state.guid,
      type: VIZ_DRAG_TYPE,
      originalIndex: state.index,
      originalSection: state.section
    },
    collect(monitor) {
      return {
        isDragging: monitor.isDragging()
      };
    }
  });

  const [, drop] = useDrop({
    accept: VIZ_DRAG_TYPE,
    drop(item: DragItem) {
      dispatch(updateVizOrder(item.id, item.originalIndex, state.index));
    }
  });

  const style = {
    opacity: isDragging ? 0 : 1
  };

  const ref = useRef(null);
  drop(preview(ref));

  if (flipped) {
    return (
      <div ref={ref} className="query-viz" style={style}>
        <QueryEditor flip={flip} state={state} dragRef={drag} />
      </div>
    );
  } else {
    return (
      <div ref={ref} className="query-viz" style={style}>
        <QueryView
          dragRef={drag}
          data={data}
          spec={spec as VisualizationSpec}
          loading={loading || external_load}
          flip={flip}
        />
      </div>
    );
  }
};

export default QueryViz;

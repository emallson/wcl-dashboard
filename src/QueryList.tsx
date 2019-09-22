import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { ReportCode, Guid, AppState, createViz, updateVizOrder } from './store';
import QueryViz from './QueryViz';
import { SortableContainer } from "react-sortable-hoc";

type QueryListProps = {
    code: ReportCode | null,
    guids: Guid[],
    create: typeof createViz,
}

const Queries: React.FC<QueryListProps> = ({ code, guids, create }) => {
    return (
        <div className="query-container">
            <div className="query-list">
                {guids.map((guid, index) => <QueryViz index={index} key={guid.toString()} guid={guid} code={code} />)}
            </div>
            <input type="button" value="Create" onClick={create} />
        </div>
    );
}

const SortableQueryList = SortableContainer(Queries);

const mapState = (state: AppState) => {
    return {
        code: state.main_report,
        guids: state.visualizations.keySeq().toArray(),
    };
};

const mapDispatch = (dispatch: Dispatch) => {
    return {
        create: () => dispatch(createViz()),
        updateOrder: (guid: Guid, oldIndex: number, newIndex: number) => dispatch(updateVizOrder(guid, oldIndex, newIndex)),
    };
};

const QueryList: React.FC<QueryListProps & { updateOrder: typeof updateVizOrder }> = (props) => {
    return (
        <SortableQueryList {...props} 
            axis="xy"
            useDragHandle
            onSortEnd={({oldIndex, newIndex}) => props.updateOrder(props.guids[oldIndex], oldIndex, newIndex)} />
    );
};

export default connect(mapState, mapDispatch)(QueryList);
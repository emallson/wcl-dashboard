import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

import { ReportCode, Guid, AppState } from './store';
// import { updateVizOrder } from './store/visualization';
import QueryViz from './QueryViz';
import { SectionContainer } from './Section';

type QueryListProps = {
  code: ReportCode | null;
  guids: Guid[];
};

const QueryList: React.FC<QueryListProps> = ({ code, guids }) => {
  return (
    <SectionContainer
      title="Unsorted"
      editable={false}
    >
      <div className="query-container">
        <div className="query-list">
          {guids.map((guid) => (
            <QueryViz
              // index={index}
              key={guid.toString()}
              guid={guid}
              code={code}
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};

const mapState = (state: AppState) => {
  return {
    code: state.main_report,
    guids: state.visualizations.keySeq().toArray()
  };
};

const mapDispatch = (dispatch: Dispatch) => {
  return {
  };
};

export default connect(mapState, mapDispatch)(QueryList);

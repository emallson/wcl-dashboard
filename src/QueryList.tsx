import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import { AppState } from './store';
import { SectionId } from './store/section';
import QueryViz from './QueryViz';

type QueryListProps = {
  section?: SectionId;
};

const QueryList: React.FC<QueryListProps> = ({ section }) => {
  const guids = useSelector((state: AppState) => {
    return state.visualizations
      .filter(viz => viz.section === (section || null))
      .keySeq()
      .toArray();
  }, shallowEqual);

  const code = useSelector((state: AppState) => {
    if (section) {
      return (
        state.sections.find(sec => sec.id === section)!.code ||
        state.main_report
      );
    } else {
      return state.main_report;
    }
  });

  return (
    <div className="query-container">
      <div className="query-list">
        {guids.map(guid => (
          <QueryViz
            key={guid.toString()}
            guid={guid}
            code={code}
          />
        ))}
      </div>
    </div>
  );
};

export default QueryList;

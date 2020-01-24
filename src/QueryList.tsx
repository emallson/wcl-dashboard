import React from 'react';
import { useSelector } from 'react-redux';

import { AppState } from './store';
import { SectionId } from './store/section';
// import { updateVizOrder } from './store/visualization';
import QueryViz from './QueryViz';

type QueryListProps = {
  section?: SectionId,
};

const QueryList: React.FC<QueryListProps> = ({ section: rawSection }) => {
  const section = rawSection ? rawSection : null;
  const guids = useSelector((state: AppState) => {
    return state.visualizations.filter(viz => viz.section === section).keySeq().toArray();
  });

  const code = useSelector((state: AppState) => {
    if(section) {
      return state.sections.find(sec => sec.id === section)!.code || state.main_report;
    } else {
      return state.main_report;
    }
  });

  return (
    <div className="query-container">
      <div className="query-list">
        {guids.map(guid => (
          <QueryViz
            // index={index}
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

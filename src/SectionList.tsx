import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from './store';
import Section, { SectionContainer } from './Section';
import QueryList from './QueryList';

const SectionList = () => {
  const sections = useSelector((state: AppState) =>
    state.sections.map(sec => sec.id)
  );

  return (
    <div className="section-container">
      <div className="section-list">
        <SectionContainer title={"Unsorted"} editable={false} index={-1} >
          <QueryList />
        </SectionContainer>
        {sections.map((sec, index) => (
          <Section key={sec.toString()} guid={sec} index={index} />
        ))}
      </div>
    </div>
  );
};

export default SectionList;

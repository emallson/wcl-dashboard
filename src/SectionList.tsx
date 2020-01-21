import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from './store';
import Section from './Section';

const SectionList = () => {
  const sections = useSelector((state: AppState) =>
    state.sections.keySeq().toArray()
  );

  return (
    <div className="section-container">
      <div className="section-list">
        {sections.map(sec => (
          <Section key={sec.toString()} guid={sec} />
        ))}
      </div>
    </div>
  );
};

export default SectionList;

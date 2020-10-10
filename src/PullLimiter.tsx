import React, { ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { AppState } from './store';
import { SectionId, SET_SECTION_PULLS } from './store/section';

import styles from './PullLimiter.module.scss';

interface Props {
  id: SectionId;
}

const PullLimiter = (props: Props) => {
  const pulls = useSelector((state: AppState) => state.sections.find(sec => sec.id === props.id)!.pulls) || "all";
  const dispatch = useDispatch();

  const change = (event: ChangeEvent) => {
    const raw = (event.target as HTMLInputElement).value;
    let pulls;
    if (raw === 'all') {
      pulls = raw;
    } else {
      pulls = Number.parseInt(raw);
    }

    dispatch({
      type: SET_SECTION_PULLS,
      id: props.id,
      pulls: pulls,
    });
  };

  const name = `pull-limiter-${props.id.toString()}`;

  const Option = ({ label, value }: { label: string, value: string | number }) => (
    <>
      <input type="radio" value={value} name={name} id={`${name}-${value}`} checked={value === pulls} onChange={change}></input>
      <label htmlFor={`${name}-${value}`}>{label}</label>
    </>
  );

  return (
    <div className={styles['pull-limiter']}>
      <Option label="All Pulls" value="all" />
      <Option label="5 Pulls" value={5} />
      <Option label="3 Pulls" value={3} />
      <Option label="Last Pull" value={1} />
    </div>
  );
};

export default PullLimiter;

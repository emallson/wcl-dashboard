import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Icon } from 'react-icons-kit';
import { SectionId } from './store/section';
import { AppState } from './store';
import QueryViz from './QueryViz';
import { ic_navigate_next as collapsed_icon } from 'react-icons-kit/md/ic_navigate_next';
import { ic_mode_edit as edit_icon } from 'react-icons-kit/md/ic_mode_edit';
import { ic_delete_forever as delete_icon } from 'react-icons-kit/md/ic_delete_forever';
import { ic_done as done_icon } from 'react-icons-kit/md/ic_done';

import './Section.scss';

export const SectionContainer = (props: {
  title: any;
  children: any;
  editable?: boolean;
}) => {
  // TODO: should move this logic out into a separate component that
  // gets passed as the `title` param.
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);

  const controls =
    props.editable !== false ? (
      <div className="section-control">
        {editing ? (
          <>
            <div
              className="hover"
              style={{
                display: 'inline-block',
                marginRight: '1em'
              }}
            >
              <Icon size={20} icon={delete_icon} /> Delete
            </div>
            <Icon
              size={20}
              icon={done_icon}
              className="hover"
              onClick={() => setEditing(false)}
            />
          </>
        ) : (
          <Icon
            size={20}
            icon={edit_icon}
            className="hover"
            onClick={() => setEditing(true)}
          />
        )}
      </div>
    ) : null;

  return (
    <div className={`section ${collapsed ? 'collapsed' : ''}`}>
      <div className="section-head">
        <div
          className="section-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Icon size={20} icon={collapsed_icon} />
        </div>
        {props.title}
        {controls}
      </div>
      <div className="section-content">{collapsed ? null : props.children}</div>
    </div>
  );
};

const Section = ({ guid }: { guid: SectionId }) => {
  const section = useSelector((state: AppState) => state.sections.get(guid)!);

  const views = section.contents.toArray().map((vid, index) => {
    return (
      <QueryViz key={vid.toString()} code={null} guid={vid} index={index} />
    );
  });

  return (
    <SectionContainer title={<span>{section.title}</span>}>
      {views}
    </SectionContainer>
  );
};

export default Section;

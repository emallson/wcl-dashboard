import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Icon } from 'react-icons-kit';
import {
  SectionId,
  SET_SECTION_TITLE,
  DELETE_SECTION,
  UPDATE_SECTION_ORDER
} from './store/section';
import { SET_VIZ_SECTION } from './store/visualization';
import { AppState } from './store';
import { DragItem as VizDragItem, VIZ_DRAG_TYPE } from './QueryViz';
import QueryList from './QueryList';
import { Handle } from './QueryViz';
import PullLimiter from './PullLimiter';
import { ic_navigate_next as collapsed_icon } from 'react-icons-kit/md/ic_navigate_next';
import { ic_mode_edit as edit_icon } from 'react-icons-kit/md/ic_mode_edit';
import { ic_delete_forever as delete_icon } from 'react-icons-kit/md/ic_delete_forever';
import { ic_done as done_icon } from 'react-icons-kit/md/ic_done';
import { useDrag, useDrop } from 'react-dnd';

import './Section.scss';

const SEC_DRAG_TYPE = 'SEC_DRAG_TYPE';

interface DragItem {
  type: typeof SEC_DRAG_TYPE;
  id: SectionId | undefined;
  originalIndex: number;
}

export const SectionContainer = (props: {
  id?: SectionId;
  index: number;
  title: string;
  children: any;
  editable?: boolean;
}) => {
  // TODO: should move this logic out into a separate component that
  // gets passed as the `title` param.
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(props.title);
  const dispatch = useDispatch();

  const ref = useRef(null);

  const [, vizDrop] = useDrop({
    accept: VIZ_DRAG_TYPE,
    drop(item: VizDragItem) {
      dispatch({
        type: SET_VIZ_SECTION,
        section: props.id ? props.id : null,
        guid: item.id
      });
    }
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: SEC_DRAG_TYPE, id: props.id },
    collect(monitor) {
      return {
        isDragging: monitor.isDragging()
      };
    }
  });

  const [, drop] = useDrop({
    accept: SEC_DRAG_TYPE,
    canDrop() {
      return props.id !== undefined;
    },
    drop(item: DragItem) {
      dispatch({
        type: UPDATE_SECTION_ORDER,
        id: item.id,
        newIndex: props.index
      });
    }
  });

  vizDrop(drop(preview(ref)));

  const controls =
    props.editable !== false ? (
      <div className="section-control">
        {props.id && <PullLimiter id={props.id!} />}
        {editing ? (
          <>
            <div
              className="hover"
              style={{
                display: 'inline-block',
                marginRight: '1em'
              }}
              onClick={() =>
                dispatch({
                  type: DELETE_SECTION,
                  id: props.id
                })
              }
            >
              <Icon size={20} icon={delete_icon} /> Delete
            </div>
            <Icon
              size={20}
              icon={done_icon}
              className="hover"
              onClick={() => {
                setEditing(false);
                dispatch({
                  type: SET_SECTION_TITLE,
                  id: props.id!,
                  title: currentTitle
                });
              }}
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

  const titleControl = editing ? (
    <input
      type="text"
      value={currentTitle}
      onChange={e => setCurrentTitle(e.target.value)}
    />
  ) : (
    props.title
  );

  const style = {
    opacity: isDragging ? 0 : 1
  };

  return (
    <div
      ref={ref}
      className={`section ${collapsed ? 'collapsed' : ''}`}
      style={style}
    >
      <div className="section-head">
        <Handle dragRef={drag} />
        <div
          className="section-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Icon size={20} icon={collapsed_icon} />
        </div>
        <span>{titleControl}</span>
        {controls}
      </div>
      <div className="section-content">{collapsed ? null : props.children}</div>
    </div>
  );
};

const Section = ({ guid, index }: { guid: SectionId; index: number }) => {
  const section = useSelector(
    (state: AppState) => state.sections.find(sec => sec.id === guid)!
  );

  const views = <QueryList section={guid} />;
  return (
    <SectionContainer id={guid} title={section.title} index={index}>
      {views}
    </SectionContainer>
  );
};

export default Section;

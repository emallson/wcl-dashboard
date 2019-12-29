import * as React from 'react';
import { connect, useDispatch } from 'react-redux';
import { Dispatch } from 'redux';
import { debounce } from 'debounce';

import { SideNav, Nav, NavContext } from 'react-sidenav';
import { Icon as BaseIcon } from 'react-icons-kit';
import { navicon as menu_icon } from 'react-icons-kit/fa/navicon';
import { refresh } from 'react-icons-kit/fa/refresh';
import { download } from 'react-icons-kit/entypo/download';
import { plus as add } from 'react-icons-kit/entypo/plus';

import {
    BEGIN_IMPORT,
    toReportCode,
    setMainReport,
    updateReport,
    ReportCode,
    AppState
} from './store';
import { createViz } from './store/visualization';
import { bulkExport } from './store/bulk_export';
import parse from 'url-parse';

import './Sidebar.scss';

type MenuBarProps = {
    title: string | null;
    code: ReportCode | null;
    update: typeof updateReport;
    create: typeof createViz;
    beginImport: () => void;
};

const Icon = (props: any) => (
    <BaseIcon
        {...{
            size: 28,
            style: {
                marginRight: '1em'
            },
            className: 'hover'
        }}
        {...props}
    />
);

const _MenuBar: React.FC<MenuBarProps> = ({
    create,
    beginImport,
    code,
    update,
    title
}) => {
    const [sidebarVisible, setSidebarVisible] = React.useState(false);

    const sidebar = <SideBar closeSidebar={() => setSidebarVisible(false)} />;

    return (
        <>
            <div className="menu-top">
                <Icon
                    icon={menu_icon}
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                />
                <span>{title ? title : 'No Log Selected'}</span>
                <Icon
                    icon={refresh}
                    style={{
                        marginLeft: '0.5em'
                    }}
                    size={16}
                    onClick={() => (code ? update(code) : null)}
                />
                <div className="right">
                    <Icon icon={add} onClick={() => create()} />
                    <Icon icon={download} onClick={() => beginImport()} />
                </div>
            </div>
            {sidebarVisible ? sidebar : null}
        </>
    );
};

function menuBarState(state: AppState) {
    if (state.main_report) {
        return {
            code: state.main_report,
            title: state.reports.getIn([state.main_report, 'title'], null)
        };
    } else {
        return { title: null, code: null };
    }
}

function menuBarDispatch(dispatch: Dispatch) {
    return {
        update: (code: ReportCode) => dispatch<any>(updateReport(code)),
        beginImport: () => dispatch({ type: BEGIN_IMPORT }),
        create: () => dispatch(createViz())
    };
}

export const MenuBar = connect(menuBarState, menuBarDispatch)(_MenuBar);

type SideBarProps = {
    currentCode: ReportCode | null;
    reports: Array<ReportEntryProps>;
    setMainReport: (code: string) => void;
    updateReport: (code: string) => void;
    closeSidebar: () => void;
};

type ReportEntryProps = {
    code: ReportCode;
    date: Date;
    title: string;
};

const ReportEntry: React.FC<ReportEntryProps> = props => {
    const context = React.useContext(NavContext);
    return (
        <div className={`sidebar-item ${context.selected ? 'selected' : ''}`}>
            <em>
                {props.date.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}
            </em>
            <h4>{props.title}</h4>
        </div>
    );
};

export const parseCode = (code: string): string => {
    const path = parse(code, 'https://www.warcraftlogs.com/reports/');
    return path.pathname.split('/')[2];
};

const ReportInput: React.FC<{
    setMainReport: (code: string) => void;
    updateReport: (code: string) => void;
    closeSidebar: () => void;
}> = ({ updateReport, setMainReport, closeSidebar }) => {
    const handler = debounce((originalCode: string) => {
        const code = parseCode(originalCode);
        setMainReport(code);
        updateReport(code);
        closeSidebar();
    }, 200);

    return (
        <>
            <div className="sidebar-add-label">Add New Report...</div>
            <input type="text" onChange={e => handler(e.target.value)} />
        </>
    );
};

const _SideBar: React.FC<SideBarProps> = props => {
    const dispatch = useDispatch();

    const reportItems = props.reports.map(report => {
        return (
            <Nav id={report.code.toString()} key={report.code.toString()}>
                <ReportEntry {...report} />
            </Nav>
        );
    });
    return (
        <div className="menu-side">
            <SideNav
                onSelection={code => {
                    props.closeSidebar();
                    props.setMainReport(code);
                }}
                defaultSelectedPath={
                    props.currentCode ? props.currentCode.toString() : ''
                }
            >
                {reportItems}
            </SideNav>
            <ReportInput
                updateReport={props.updateReport}
                setMainReport={props.setMainReport}
                closeSidebar={props.closeSidebar}
            />
            <div style={{ margin: 5, marginLeft: 10 }}>
                <span onClick={() => dispatch(bulkExport())}>
                    <em>Export All</em>
                </span>
            </div>
        </div>
    );
};

function sidebarState(state: AppState) {
    return {
        currentCode: state.main_report,
        reports: state.reports
            .map((report, code) => {
                return {
                    code,
                    date: new Date(report.start!),
                    title: report.title!
                };
            })
            .valueSeq()
            .sortBy(r => r.date)
            .reverse()
            .toArray()
    };
}

function sidebarDispatch(dispatch: Dispatch) {
    return {
        updateReport: (code: string) =>
            dispatch<any>(updateReport(toReportCode(code))),
        setMainReport: (code: string) =>
            dispatch(setMainReport(toReportCode(code)))
    };
}

const SideBar = connect(sidebarState, sidebarDispatch)(_SideBar);

import React from 'react';
import { useSelector } from 'react-redux';
import 'react-toastify/dist/ReactToastify.min.css';
import { ToastContainer } from 'react-toastify';

import { AppState } from './store';
import './App.css';

import { MenuBar } from './Sidebar';
import ExportView from './ExportView';
import ImportView from './ImportView';
import QueryList from './QueryList';
import SectionList from './SectionList';

type Props = {};

const App: React.FC<Props> = () => {
  const { exporting, importing } = useSelector((state: AppState) => {
    return {
      exporting: state.exporting,
      importing: state.importing
    };
  });

  return (
    <>
      <ToastContainer
        position="top-right"
        bodyClassName="toast-text"
        autoClose={10000}
      />
      <MenuBar />
      <QueryList />
      <SectionList />
      {exporting ? <ExportView guid={exporting} /> : null}
      {importing ? <ImportView /> : null}
    </>
  );
};

export default App;

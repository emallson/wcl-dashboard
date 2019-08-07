import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import './App.css';
import { ApiKey, AppState, setApiKey } from './store';


const DemandApiKey: React.FC<{ setApiKey: (key: string) => void }> = ({ setApiKey }) => {
    return (
        <div className="App">
            <span>Before continuing, please input your WCL Public API Key: </span>
            <input type="text" id="api_key_input" />
            <input type="button" value="OK" onClick={() => {
                const el = document.getElementById("api_key_input")! as HTMLInputElement;
                const key = el.value;
                setApiKey(key);
            }} />
        </div>
    )
};

type Props = {
    api_key: ApiKey | null,
    setApiKey: (key: string) => void,
};

const InnerApp: React.FC<Props> = ({ api_key, setApiKey }) => {
    if (api_key === null) {
        return <DemandApiKey setApiKey={setApiKey} />;
    } else {
        return (<div>{ api_key }</div>);
    }
};

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        setApiKey: (key: string) => dispatch(setApiKey(key))
    }
}

function mapStateToProps({ api_key }: AppState) {
    return { api_key };
}

export default connect(mapStateToProps, mapDispatchToProps)(InnerApp);

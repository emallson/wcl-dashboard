import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import PulseLoader from 'react-spinners/PulseLoader';
import { css } from '@emotion/core';

import { ApiKey, setApiKey, toApiKey } from './store';
import { validate_key } from './api_key';

type Props = {
    setApiKey: typeof setApiKey,
};

type State = {
    validation_promise: Promise<void> | null,
    key_invalid: boolean,
};

const loader_override = css`
    display: inline-box;
`;

class DemandApiKey extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            validation_promise: null,
            key_invalid: false,
        };
    }

    _validateKey(key: string) {
        this.setState({ 
            validation_promise: validate_key(toApiKey(key))
            .then(isValid => {
                if(isValid) {
                    this.props.setApiKey(toApiKey(key));
                } else {
                    this._setKeyInvalid();
                    this.setState({validation_promise: null});
                }
            })
            .catch(() => {
                this._setKeyInvalid();
                this.setState({validation_promise: null});
            })
        });
    }

    _setKeyInvalid() {
        this.setState({ key_invalid: true });
    }

    render() {
        const btn = (
                <input type="button" value="OK" onClick={() => {
                    const el = document.getElementById("api_key_input")! as HTMLInputElement;
                    const key = el.value;
                    this._validateKey(key);
                }} />
        );
        return (
            <div className="App">
                <span>Before continuing, please input your WCL Public API Key: </span>
                <input type="text" id="api_key_input" style={this.state.key_invalid ? { border: '1px solid red' } : {}}/>
                {(this.state.validation_promise !== null) ? <PulseLoader size={10} css={loader_override}/> : btn}
                {this.state.key_invalid ? <div>Unable to validate API key with WarcraftLogs.</div> : null}
            </div>
        );
    }
}

export default connect(() => { return {}; }, (dispatch: Dispatch) => {
    return {setApiKey: (key: ApiKey | string) => dispatch(setApiKey(key))};
})(DemandApiKey);

import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { decompressFromBase64 } from 'lz-string';

import { AppState, importViz, isVizState, CANCEL_IMPORT } from './store';
import { VizState } from './store/visualization';

import './ExportView.scss';

type ImportViewProps = {
    importViz: (state: VizState) => void;
    cancelImport: () => void;
};

type ImportViewState = {
    currentState: VizState | null;
    validText: boolean | null;
};

class ImportView extends React.Component<ImportViewProps, ImportViewState> {
    constructor(props: ImportViewProps) {
        super(props);

        this.state = {
            currentState: null,
            validText: null
        };
    }

    validateText(text: string) {
        console.log(text);
        if (text.length === 0) {
            // empty text
            this.setState({ currentState: null, validText: null });
        }

        try {
            const dec = decompressFromBase64(text);
            const state = JSON.parse(dec);
            if (isVizState(state)) {
                this.setState({
                    currentState: state,
                    validText: true
                });
            } else {
                console.log(state);
                this.setState({
                    currentState: null,
                    validText: false
                });
            }
        } catch (err) {
            console.log(err);
            this.setState({
                currentState: null,
                validText: false
            });
        }
    }

    render() {
        const { currentState, validText } = this.state;
        const { importViz, cancelImport } = this.props;

        const textboxStyle =
            validText === false
                ? {
                      border: 'solid 1px red'
                  }
                : {};

        return (
            <>
                <div id="export-background-block" />
                <div id="import-view">
                    <textarea
                        placeholder="Paste string here..."
                        cols={80}
                        rows={8}
                        onChange={e => this.validateText(e.target.value)}
                        style={textboxStyle}
                    />
                    <br />
                    <button style={{ float: 'left' }} onClick={cancelImport}>
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            currentState ? importViz(currentState) : null
                        }
                        disabled={currentState === null}
                    >
                        Import
                    </button>
                </div>
            </>
        );
    }
}

function mapState(state: AppState) {
    return {};
}

function mapDispatch(dispatch: Dispatch) {
    return {
        importViz: (state: VizState) => dispatch(importViz(state)),
        cancelImport: () => dispatch({ type: CANCEL_IMPORT })
    };
}

export default connect(mapState, mapDispatch)(ImportView);

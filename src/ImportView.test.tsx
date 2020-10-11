import React from 'react';
import { mount } from 'enzyme';
import ImportView from './ImportView';
import { rootReducer, createState } from './store';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

describe('ImportView', () => {
  let store = null;

  beforeEach(() => {
    store = createStore(rootReducer, createState());
  });

  it('should show a warning when a prescript is present', () => {
    const tree = mount(
      <Provider store={store}>
        <ImportView />
      </Provider>
    );

    const input = tree.find('textarea');
    input.simulate('change', {
      target: {
        value:
          'N4Ig5grglgJiBcIDGSDMMAMAWDBWAtABwBmAjDPsQEZJX4YbEBsRxMAnGwOxbGqmkQAGhABnAA4BTJAlABbAIYAnANYIQVZcJCSAdkgD2MKLrCyQAD3PEokgDZxEhiLoAu21wE8p6gI4QFNyhXBVcoADdJEABfEU9rWwd1EKUwSVcAOQU5KJEvH0RdAzkTBTsY6NiQf0klePhQGztXWuTvSQBeAB0QGElQgAsegAJAmGGUtNcAOmMJA1FgqANdbpBiJVtdGDtPEbGJ5SnpgwB3XVrp3WzJYY7D1PSrm+0qBcXHXQg7OxEkCFcBmIxAQuBEKhMjlAEO26kkkTcFREomkYRW6lICk47AATIRSEQqKRCPhcFwuHRJGQcfQMGhOLgkEwqOwMNpIZIrPAcSJxEpJKIkJtxO4nCtRK5hjBiHdhhdTsNiAZHtMACKhBQAMSUNwAFDANQBKADcXV0ZsMulEBjskmmdgMYH1RtN5v04sl/NEsul0zASgMEHEACFPLqAwqOgA+YYR6aTdJZHKGs3DYbTFG2pCuXX+wPiO4x3XAVNph5TJOSeDDPNB6Y2JQS3WG+NHRM3ISltPONzV2viaY9nMp3Rp6KGkdp6YmYh2UKSZul+MGACCSh1YZNZrN/O2tXDApNMSAA==='
      }
    });

    expect(tree.exists('.warning')).toBe(true);
  });

  it('should not show a warning if the prescript is present but blank', () => {
    const tree = mount(
      <Provider store={store}>
        <ImportView />
      </Provider>
    );

    const input = tree.find('textarea');
    input.simulate('change', {
      target: {
        value:
          'N4Ig5grglgJiBcIDGSDMMAMAWDBWAtABwBmAjDPsQEZJX4YbEBsRxMAnGwOxbGqmkQAGhABnAA4BTJAlABbAIYAnANYIQVZcJCSAdkgD2MKLrCyQAD3PEokgDZxEhiLoAu21wE8p6gI4QFNyhXBVcoADdJEABfEU9rWwd1EKUwSVcAOQU5KJEvH0RdAzkTBTsY6NiQf0klePhQGztXWuTvSQBeAB0QGElQgAsegAJAmGGUtNcAOmMJA1FgqANdbpBiJVtdGDtPEbGJ5SnpgwB3XVrp3WzJYY7D1PSrm+0qBcXHXQg7OxEkCFcBmIxAQuBEKhMjlAEO26kkkTcFREomkYRW6lICk47AATIRSEQqKRCPhcFwuHRJGQcfQMGhOLgkEwqOwMNpIZIrPAcSJxEpJKIkJtxO5EDEgA'
      }
    });

    expect(tree.exists('.warning')).toBe(false);
  });
});

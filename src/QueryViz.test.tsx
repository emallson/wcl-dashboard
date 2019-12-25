import React from 'react';
import renderer from 'react-test-renderer';
import { QueryView, QueryEditor } from './QueryViz';
import serializer from 'jest-emotion';

// dealing with the grid loader
expect.addSnapshotSerializer(serializer);

const dummyFlip = () => {};

describe('QueryView', () => {
    const testSpec = {
        title: "Testing, Dummy",
        mark: "bar",
        encoding: {
            x: {
                field: "x",
                "type": "quantitative"
            },
            y: {
                field: "y",
                "type": "nominal"
            }
        }
    };

    const testData = [
        { x: 5, y: "five" },
        { x: 10, y: "ten" }
    ];

    it('renders correctly without data', () => {
        const tree = renderer.create(
            <QueryView
                data={null}
                loading={false}
                spec={testSpec}
                flip={dummyFlip}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with some data', () => {
        const tree = renderer.create(
            <QueryView
                data={testData}
                loading={false}
                flip={dummyFlip}
                spec={testSpec}
            />
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly when no data is relevant', () => {
        const tree = renderer.create(
            <QueryView
                data={[]}
                loading={false}
                flip={dummyFlip}
                spec={testSpec}
            />
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly when loading', () => {
        const tree = renderer.create(
            <QueryView
                data={testData}
                loading={true}
                flip={dummyFlip}
                spec={testSpec}
            />
        ).toJSON();
        expect(tree).toMatchSnapshot();
    });
});

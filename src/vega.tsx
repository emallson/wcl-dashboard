import React from 'react';
import embed, { EmbedOptions, VisualizationSpec, Result } from 'vega-embed';
import equal from 'fast-deep-equal';
export * from 'vega-embed';

type VegaProps = {
    spec: VisualizationSpec,
    options?: EmbedOptions,
    className?: string,
};

export default class Vega extends React.Component<VegaProps> {
    plotRef = React.createRef<HTMLDivElement>();
    promise?: Promise<Result['view'] | undefined>;

    shouldComponentUpdate(nextProps: VegaProps) {
        return !equal(nextProps, this.props);
    }

    createPlot() {
        console.log('building plot');
        if(this.plotRef.current) {
            this.promise = embed(this.plotRef.current, this.props.spec, this.props.options)
                .then(({ view }) => view)
                .catch((error) => { console.error(error); return undefined; });
        }
    }

    destroyPlot() {
        if(this.promise) {
            this.promise.then((view) => view ? view.finalize() : undefined);
            this.promise = undefined;
        }
    }

    componentDidMount() {
        this.createPlot();
    }

    componentDidUpdate() {
        this.destroyPlot();
        this.createPlot();
    }

    render() {
        const { className } = this.props;
        return (
            <div ref={this.plotRef} className={className} />
        );
    }
}

import * as forge from 'data-forge';

window.addEventListener('message', (event: MessageEvent) => {
    const { guid, script, data, spec} = event.data;
    let result = null;
    const render = (res: any) => { result = { ...data, values: res }};

    let kind = 'success';
    try {
        // eslint-disable-next-line
        Function('const [forge, data, spec, render] = arguments; ' + script)(forge, data.values, spec, render);
    } catch (err) {
        kind = 'error';
        result = err.message;
    }

    (event.source as Window).postMessage({
        guid,
        kind,
        result,
    }, "*");
});

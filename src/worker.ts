import Worker from './runner.worker';

window.addEventListener('message', (event: MessageEvent) => {
    const worker = new (Worker as any)();

    const { guid } = event.data;

    const timeout = setTimeout(() => {
        worker.terminate();

        (event.source as Window).postMessage({
            guid,
            kind: 'error',
            result: 'script time limit exceeded',
        }, "*");
    }, 5000);

    worker.addEventListener('message', (response: MessageEvent) => {
        const { kind, result } = response.data;
        (event.source as Window).postMessage({
            guid,
            kind,
            result,
        }, "*");

        worker.terminate();
        clearTimeout(timeout);
    });

    worker.postMessage(event.data);
});

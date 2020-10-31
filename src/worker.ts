import { Guid } from './store';
import Worker from './runner.worker';

interface WorkerState {
  worker: any;
  timeout: any;
}

const worker_registry: Map<string, WorkerState> = new Map();

function cancelWorker(guid: Guid) {
  const state = worker_registry.get(guid.toString());
  if (!state) {
    return;
  }

  worker_registry.delete(guid.toString());
  const { worker, timeout } = state;

  if (worker) {
    worker.terminate();
  }

  if (timeout) {
    clearTimeout(timeout);
  }
}

function registerWorker(guid: Guid, worker: any, timeout: any) {
  console.assert(!worker_registry.has(guid.toString()));

  worker_registry.set(guid.toString(), {
    worker,
    timeout
  });
}

window.addEventListener('message', (event: MessageEvent) => {
  const worker = new (Worker as any)();

  const { guid } = event.data;

  cancelWorker(guid);

  const timeout = setTimeout(() => {
    cancelWorker(guid);

    (event.source as Window).postMessage(
      {
        guid,
        kind: 'error',
        result: 'script time limit exceeded'
      },
      '*'
    );
  }, 15000);

  worker.addEventListener('message', (response: MessageEvent) => {
    const { kind, result } = response.data;
    (event.source as Window).postMessage(
      {
        guid,
        kind,
        result
      },
      '*'
    );

    cancelWorker(guid);
  });

  registerWorker(guid, worker, timeout);

  worker.postMessage(event.data);
});

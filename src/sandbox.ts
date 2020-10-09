import { Guid } from './store';

export type ScriptResult = (kind: 'success' | 'error', result: any) => void;

const pending_callbacks = new Map<string, ScriptResult>();

window.addEventListener('message', event => {
  const worker_frame = document.getElementById(
    'worker-frame'
  ) as HTMLIFrameElement;
  if (event.source !== worker_frame.contentWindow) {
    return;
  }

  const { guid, kind, result } = event.data;

  console.log('received message for', guid, kind, result);

  const cb = pending_callbacks.get(guid.toString());

  if (!cb) {
    console.warn('Sandbox: ignoring result for GUID', guid);
    return;
  }

  pending_callbacks.delete(guid.toString());
  cb(kind, result);
});

export function runScript(
  guid: Guid,
  script: string,
  data: any,
  spec: any,
  callback: ScriptResult
) {
  console.log('running script for', guid);
  const worker_frame = document.getElementById(
    'worker-frame'
  ) as HTMLIFrameElement;

  pending_callbacks.set(guid.toString(), callback);

  worker_frame.contentWindow!.postMessage(
    {
      guid,
      script,
      data,
      spec
    },
    '*'
  );
}

// Note: this is not a true cancel---it cannot stop a running script.
export function cancelScript(guid: Guid) {
  pending_callbacks.delete(guid.toString());
}

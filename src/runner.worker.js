import * as forge from 'data-forge';

// eslint-disable-next-line
addEventListener('message', event => {
  const { guid, script, data, spec } = event.data;
  let result = null;
  let kind = 'success';
  const render = res => {
    result = { ...data, values: res };
  };

  try {
    // eslint-disable-next-line
    Function('const [forge, data, spec, render] = arguments; ' + script)(
      forge,
      data.values,
      spec,
      render
    );
  } catch (err) {
    kind = 'error';
    result = err.message;
  }

  postMessage({
    guid,
    kind,
    result
  });
});

export default null;

Client-side dashboard to visualize [WarcraftLogs](https://warcraftlogs.com)
query results.

Currently hosted on [Heroku](https://wcl-dashboard.herokuapp.com) with a lazy
dyno that only runs when requested. May need to refresh once or twice to have
it pop up.

# What does this look like?

This WA-like string:

```
N4Ig5grglgJiBcIDMAzAnAUzQVgAxIFoB2ARgEMMClsUUCS1c0CYMAOAFgwyQCZ8SAIxAAaEAGcADhgDGCUFLIyoAOzAJsYwQHsIKmOIQgUAGwjiAFqJCClAazAAnXfqMBiFDBQA2HtYBuMtoqMmQALggA2qAAtmSOdka2jtYWGFBgFhHwSLhiGCHaMKrq8KAAHvLGUBgmcIhh8WAYYQByZDEY1mEAntJGKtoxqmQm1mTlUIbwKhAmJmLi2o7ZoCg1dUaNjs1tHV1i2pJGQXoRh46sKYhk4jIFxWogAL7PYj1V67X1IGSCUCYoL0AHQqfbjMBODBgcJdRCnFTnEC9fqIACOEDIiKB4Sg/gOv0m01m81ebwUkiUJQ0WhcBiMpnMVjEFiCIXCUVABSCj1KFU+Gx+2127U63T6cJAg2GYLGYjCQJMkoACiYyD0MClFstVtVvlsmi1RQSjicXEjllcjLd7vpqa93gL9Td/oCQWCxfKJQMhiM5cjFZKANIAwFqAAEAEFXUCPtqVk7Ni6AbHQeDDsd4ebrJbNUZWHcHvaHSA1RrrtEQHEEkZHLIkdyitSyiAgiZllUyJC6zCwpKEUiUZLLX7uoH3OHtChwwARDDhCyGRahJVVO5pMUNecmQRmDCGN6l6EPBAkkxkkSxeKJLflBuFXlVPt3zvd6Gws1ncWokAj2UvV4AF1ySra8kniawAHdYDCKwcjyEBG0fFtKhbL4k2RQ09k9X4317ftsy9H8MSxBVGgVfFxiJU85nPR00MFa0Y3ddNkW9RBpVHMQJimGj5njXV0J+P4UxYnDTSzL8LitRAC1tR8yWeYDgLEDFNQ+BiTD7a4QAACl0ocAF4AB0QBgDouwwUzwyxGBJ3xBJQ3DAA+cNcBs/QbOYno006ABCEyQAAZUaSFNVMgBKSdHHDIzTNUcRGjsUNIo8uzhRaYFtEglRNV8jBw0M2KsPytLip2TLiikbRxCBKBgkClBHBqfQTB6UzrB0cRap+XheDQJBrBkCAwinFAECQMRktcFtpp+DB8URACxFUVhUNwZ4gA=
```

produces this visualization of deaths over an entire log:

![deaths visual](./deaths_visual.png)

# How do I use this?

Enter your WCL API key (from [here](https://www.warcraftlogs.com/profile)), then
pick a report.

Data is collected for a [WCL query](https://www.warcraftlogs.com/help/pins),
then displayed according to
a [Vega-Lite](https://vega.github.io/vega-lite/examples/) (or [Vega](https://vega.github.io/vega/examples/), if you're crazy) spec.

# Limitations

- This is entirely client-side, with all the limitations that that entails.
- It is currently not possible to do state-based transforms like what are
  required for the [Arcing Current
  Tracker](https://colab.research.google.com/drive/1IjNkN-jsgkiI_qickQrrMTbjjG5Q0mnY).
  This is on my to-do list.
- You cannot combine results from multiple reports. Also on my to-do list.

# Contributing

I am not currently accepting contributions. Check again later.

# License

See [LICENSE](./LICENSE).

# Zeebe TPS Test

Uses the Zeebe Node client to do a ghetto TPS test. See [this post in the Zeebe forum](https://forum.zeebe.io/t/whats-the-broker-ratelimit-strategy/1370/2) for an example of the output.

This is only useful to test the relative performance of releases - that is: you run this test on the same hardware with different releases to see how they differ.

This starts workflows as fast as possible. The BPMN model has a single service task, and the test does not service the task or complete the workflow.

## Install

```bash
npm i -g ts-node typescript
npm i
```

## Run

* Start a Zeebe broker on localhost.
* `ts-node app.ts`

## Disabling Backpressure

On 0.23.2 and later, you can disable backpressure by adding this to `config/application.yml`:

```yaml
backpressure:
  enabled: false
```

See [this commit](https://github.com/zeebe-io/zeebe/pull/4610/files#diff-42a9463a276119a1605b888ddc669524R244) for more details.
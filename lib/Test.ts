// tslint:disable-next-line: no-implicit-dependencies
import {
  GenericContainer,
  StartedTestContainer,
  Wait,
} from "@sitapati/testcontainers";
import { Generator } from "./Generator";

export class Test {
  zeebeVersion: string;
  withWorker: boolean;
  container?: StartedTestContainer;
  generator?: Generator;
  disableBackpressure: boolean;
  partitionCount: string;
  constructor({
    zeebeVersion,
    withWorker,
    disableBackpressure,
    partitionCount,
  }: {
    zeebeVersion: string;
    withWorker: boolean;
    disableBackpressure: boolean;
    partitionCount: string;
  }) {
    this.zeebeVersion = zeebeVersion;
    this.withWorker = withWorker;
    this.disableBackpressure = disableBackpressure;
    this.partitionCount = partitionCount;
  }

  async start() {
    let container = new GenericContainer(
      "camunda/zeebe",
      this.zeebeVersion,
      undefined,
      26500
    )
      .withExposedPorts(26500)
      .withWaitStrategy(Wait.forLogMessage("Bootstrap Broker-0 succeeded."))
      .withEnv("ZEEBE_BROKER_CLUSTER_PARTITIONSCOUNT", this.partitionCount);

    container = this.disableBackpressure
      ? container.withEnv("ZEEBE_BROKER_BACKPRESSURE_ENABLED", "false")
      : container;
    const backpressureMessage = this.disableBackpressure
      ? "Backpressure disabled"
      : "";
    console.log(
      `Starting Zeebe ${this.zeebeVersion} with ${this.partitionCount} partitions | ${backpressureMessage}...`
    );
    this.container = await container.start();
    console.log(`Started Zeebe broker`);

    this.generator = new Generator(+this.partitionCount);
    this.generator.start();
  }

  async stop() {
    await this.generator?.stop();
    await this.container?.stop();
    return {
      runningAverage: this.generator?.runningAverage,
      started: this.generator?.started,
    };
  }
}

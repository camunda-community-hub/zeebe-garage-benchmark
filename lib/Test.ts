// tslint:disable-next-line: no-implicit-dependencies
import {
  GenericContainer,
  StartedTestContainer,
  Wait,
} from "@sitapati/testcontainers";
import { Generator } from "./Generator";

export class Test {
  zeebeVersionTag: string;
  withWorker: boolean;
  container?: StartedTestContainer;
  generator?: Generator;
  disableBackpressure: boolean;
  partitionCount: string;
  cpuThreads: string;
  ioThreads: string;
  constructor({
    zeebeVersion,
    withWorker,
    disableBackpressure,
    partitionCount,
    cpuThreads,
    ioThreads,
  }: {
    zeebeVersion: string;
    withWorker: boolean;
    disableBackpressure: boolean;
    partitionCount: string;
    cpuThreads: string;
    ioThreads: string;
  }) {
    this.zeebeVersionTag = zeebeVersion;
    this.withWorker = withWorker;
    this.disableBackpressure = disableBackpressure;
    this.partitionCount = partitionCount;
    this.cpuThreads = cpuThreads || "2";
    this.ioThreads = ioThreads || "2";
  }

  async start() {
    let container = new GenericContainer(
      "camunda/zeebe",
      this.zeebeVersionTag,
      undefined, // DockerClientFactory
      26500
    )
      .withExposedPorts(26500)
      .withWaitStrategy(Wait.forLogMessage("Bootstrap Broker-0 succeeded."))
      .withEnv("ZEEBE_BROKER_CLUSTER_PARTITIONSCOUNT", this.partitionCount)
      .withEnv("ZEEBE_BROKER_THREADS_CPUTHREADCOUNT", this.cpuThreads)
      .withEnv("ZEEBE_BROKER_THREADS_IOTHREADCOUNT", this.ioThreads);

    container = this.disableBackpressure
      ? container.withEnv("ZEEBE_BROKER_BACKPRESSURE_ENABLED", "false")
      : container;
    const backpressureMessage = this.disableBackpressure
      ? "Backpressure disabled"
      : "";
    console.log(
      `Starting Zeebe ${this.zeebeVersionTag} with ${this.partitionCount} partitions | ${backpressureMessage}...`
    );
    this.container = await container.start();
    console.log(`Started Zeebe broker`);

    this.generator = new Generator(+this.partitionCount);
    await this.generator.start();
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

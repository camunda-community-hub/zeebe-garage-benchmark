import { ZBClient } from "zeebe-node";
import * as path from "path";

export class Generator {
  output?: NodeJS.Timeout;
  running: boolean;
  zbc: ZBClient;
  partitionCount: number;
  runningAverage?: string;
  started: number = 0;
  constructor(partitionCount: number) {
    this.running = false;
    this.zbc = new ZBClient({
      loglevel: "DEBUG",
    });
    this.partitionCount = partitionCount;
  }

  async start() {
    this.running = true;

    const wf = await this.zbc.deployWorkflow(
      path.join(".", "bpmn", "noop1.bpmn")
    );
    console.log("Workflow deployed: " + wf.key);
    this.started = 0;
    let time = 0;
    let last = 0;
    console.log(`Time : \t Total \t | wf/s\t | running average`);
    this.output = setInterval(() => {
      time += 5;
      console.log(
        `${time}s : \t ${this.started} \t | ${Math.round(
          (this.started - last) / 5
        )} \t | ${Math.round(this.started / time)}/sec`
      );
      last = this.started;
      this.runningAverage = `${Math.round(this.started / time)}/sec`;
    }, 5000);
    const start = () => this.zbc.createWorkflowInstance("noop1", {});

    do {
      await start().catch(() => console.log("Error 13"));
      this.started++;
    } while (this.running == true);
  }

  async stop() {
    this.running = false;
    clearInterval(this.output!);
    await this.zbc.close();
    return this.started;
  }
}

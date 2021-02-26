import { Command } from "commander";
import { Test } from "./lib/Test";
import cluster from "cluster";
import { startWorker } from "./lib/worker";

if (cluster.isMaster) {
  process.on("unhandledRejection", (error) => {
    console.log("unhandledRejection", error);
  });
}

async function runTests() {
  const program = new Command();
  program.version("0.0.1");

  program
    .option(
      "-z, --zeebeVersions <versions>",
      "zeebe container version tags, comma-separated"
    )
    .option("-w, --withWorker", "Run job worker")
    .option("-d, --disableBackpressure", "Disable Backpressure")
    .option("-t, --time <time>", "Duration of test run")
    .option("-p, --partitionCount <partitions>", "Partition Count (default 1)")
    .option("-c --cpuThreads <cpuThreadCount>", "CPU Threads (default 2)")
    .option("-i --ioThreads <ioThreadCount>", "IO Threads (default 2)");

  program.parse();

  if (cluster.isMaster && program.withWorker) {
    cluster.fork();
  }

  const zeebeVersions = program.zeebeVersions.split(",");
  const partitionCount = program.partitionCount || "1";

  for (const id in cluster.workers) {
    cluster.workers[id]?.on("message", (message) => console.log(message));
  }

  const tests = zeebeVersions.map((version: string) => ({
    version,
    fn: () => {
      console.log(`\nVersion: ${version} | Time: ${program.time}s`);
      return new Promise(async (resolve) => {
        const test = new Test({
          zeebeVersion: version,
          withWorker: program.withWorker,
          disableBackpressure: program.disableBackpressure,
          cpuThreads: program.cpuThreads,
          ioThreads: program.ioThreads,
          partitionCount,
        });
        if (!test) {
          return resolve(null);
        }
        await test.start();
        setTimeout(async () => {
          const result = await test.stop();
          resolve(result);
        }, (+program.time + 2) * 1000);
      });
    },
  }));

  const results = [];
  for (let test of tests) {
    const { runningAverage, started } = await test.fn();
    console.log(`Average TPS: ${runningAverage}.`);
    results.push({
      version: test.version,
      partitions: partitionCount,
      worker: program.withWorker,
      workflowsStarted: started,
      averageTPS: runningAverage,
    });
  }

  console.log("Results", results);

  for (const id in cluster.workers) {
    cluster.workers[id]?.send("stop");
  }
}

if (cluster.isMaster) {
  runTests();
} else {
  startWorker();
}

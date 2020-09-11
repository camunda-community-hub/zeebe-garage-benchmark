import { Command } from "commander";
import { Test } from "./lib/Test";
import cluster from "cluster";
import { startWorker, stopWorker } from "./lib/worker";

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
    .option("-p, --partitionCount <partitions>", "Partition Count (default 1)");

  program.parse();

  if (cluster.isMaster && program.withWorker) {
    cluster.fork();
  }

  const zeebeVersions = program.zeebeVersions.split(",");
  const partitionCount = program.partitionCount || "1";

  const tests = zeebeVersions.map((version: string) => ({
    version,
    fn: () => {
      console.log(`\nVersion: ${version} | Time: ${program.time}s`);
      return new Promise(async (resolve) => {
        const test = new Test({
          zeebeVersion: version,
          withWorker: program.withWorker,
          disableBackpressure: program.disableBackpressure,
          partitionCount,
        });
        if (!test) {
          return resolve();
        }
        await test.start();
        setTimeout(async () => {
          const runningAverage = await test.stop();
          resolve(runningAverage);
        }, program.time * 1000);
      });
    },
  }));

  const results = [];
  for (let test of tests) {
    const runningAverage = await test.fn();
    console.log(`Average TPS: ${runningAverage}.`);
    results.push({
      version: test.version,
      average: runningAverage,
    });
  }

  console.log(results);

  stopWorker();
}

if (cluster.isMaster) {
  runTests();
} else {
  startWorker();
}

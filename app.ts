import { ZBClient } from "zeebe-node";
import * as path from "path";

// process.env.ZEEBE_NODE_LOG_LEVEL = "NONE";

const zbc = new ZBClient();

// zbc.createWorker({
//   taskType: "nothing",
//   taskHandler: (_, complete) => {
//     console.log(_);
//     complete.success();
//   },
//   maxJobsToActivate: 12800,
// });

async function main() {
  await zbc.deployWorkflow(path.join(".", "noop1.bpmn"));
  let started = 0;
  let time = 0;
  let last = 0;
  console.log(`Time : \t Total \t | wf/s\t | average/s`);
  setInterval(() => {
    time += 5;
    console.log(
      `${time}s : \t ${started} \t | ${Math.round(
        (started - last) / 5
      )} \t | ${Math.round(started / time)}/sec`
    );
    last = started;
  }, 5000);
  const start = () => zbc.createWorkflowInstance("noop1", {});
  do {
    await start();
    started++;
  } while (true == true);
}

main();

import { ZBClient } from "zeebe-node";
import * as path from "path";

// process.env.ZEEBE_NODE_LOG_LEVEL = "NONE";

const zbc = new ZBClient();

// zbc.createWorker("nothing", (_, complete) => {
//   //   console.log(_);
//   complete.success();
// });

async function main() {
  await zbc.deployWorkflow(path.join(".", "noop1.bpmn"));
  let started = 0;
  let time = 0;
  let last = 0;
  setInterval(() => {
    time += 5;
    console.log(
      `${time}s : ${started} | ${started - last} | ${Math.round(
        started / time
      )}/sec`
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
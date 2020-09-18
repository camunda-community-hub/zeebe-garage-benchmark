import { ZBClient, ZBWorker } from "zeebe-node";

process.env.ZEEBE_NODE_LOG_LEVEL = "NONE";
let _worker: ZBWorker<any, any, any>;

process.on("message", stopWorker);
let completed = 0;

export function startWorker() {
  console.log(`Starting worker...`);
  const zbc = new ZBClient();

  _worker = zbc.createWorker({
    taskType: "nothing",
    taskHandler: (_, complete) => {
      // console.log(Date.now().toLocaleString(), _.workflowInstanceKey);
      complete.success().then(() => {
        completed++;
      });
    },
    maxJobsToActivate: 1,
    loglevel: "NONE",
  });
}

export function stopWorker() {
  _worker?.close();
  process.send?.({ WorkflowsCompleted: completed });
}

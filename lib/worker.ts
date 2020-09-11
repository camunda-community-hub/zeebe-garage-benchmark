import { ZBClient, ZBWorker } from "zeebe-node";
import cluster from "cluster";

process.env.ZEEBE_NODE_LOG_LEVEL = "NONE";
let _worker: ZBWorker<any, any, any>;

export function startWorker() {
  let completed = 0;
  console.log(`Starting worker...`);
  const zbc = new ZBClient();

  _worker = zbc.createWorker({
    taskType: "nothing",
    taskHandler: (_, complete) => {
      console.log(Date.now().toLocaleString(), _.workflowInstanceKey);
      complete.success().then(() => {
        completed++;
      });
    },
    maxJobsToActivate: 1,
  });
}

export function stopWorker() {
  _worker?.close();
}

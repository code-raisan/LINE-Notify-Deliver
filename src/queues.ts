import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter as FastifyBullBoard } from "@bull-board/fastify";
import env from "./env";
import utils from "./utils";

const BullmqConnectionOptions: ConnectionOptions  = {
  host: env.REDIS.HOST,
  port: env.REDIS.PORT
}

const deliver = new Queue("deliver", {
  connection: BullmqConnectionOptions
});

const DeliverWorker = new Worker("deliver", async (job: Job) =>{
  if(job.data.token == "") throw Error("Token not set");
  utils.sendLineNotify(job.data.msg, job.data.token);
  job.updateProgress(100);
  return "done";
}, {
  concurrency: 1,
  connection: BullmqConnectionOptions
});

const adapter = new FastifyBullBoard();

createBullBoard({
  queues: [new BullMQAdapter(deliver)],
  serverAdapter: adapter
});

export default { adapter, deliver };

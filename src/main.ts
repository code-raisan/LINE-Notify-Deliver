import path from "path";
import { randomUUID } from "crypto";
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";
import { Type, Static } from "@sinclair/typebox";
import FastifyStatic from "@fastify/static";
import FastifyView from "@fastify/view";
import ejs from "ejs";
import { parse } from "csv-parse/sync";
import env from "./env";
import utils from "./utils";
import queues from "./queues";
import { readFileSync, writeFileSync } from "fs";

// Initialize
const app: FastifyInstance = Fastify({
  logger: true,
  bodyLimit: 1024*1024*30
}).withTypeProvider<JsonSchemaToTsProvider>();

app.register(FastifyStatic, {
  root: path.join(__dirname, "static"),
  prefix: "/static"
});

app.register(FastifyView, {
  engine: { ejs: ejs },
  templates: "src/template"
});

queues.adapter.setBasePath("/secure/queue");
// @ts-ignore
app.register(queues.adapter.registerPlugin(), {
  prefix: "/secure/queue"
});

// Endpoints
app.get("/", async (_request: FastifyRequest, reply: FastifyReply) =>{
  return reply.view("top.ejs", {
    APP_NAME: env.APP_NAME
  });
});

app.get("/oauth/issue", async (_request: FastifyRequest, reply: FastifyReply) =>{
  const uuid = randomUUID();
  const url = `${env.LINE_NOTIFY_OAUTH_API_ENDPOINT}/oauth/authorize?response_type=code&scope=notify&state=${uuid}&client_id=${env.LINE_NOTIFY_OAUTH_CLIENT_ID}&redirect_uri=${env.LINE_NOTIFY_OAUTH_CALLBACK}`;
  return reply.redirect(302, url);
});

const OAuthCallbackSchema = Type.Object({
  state: Type.String(),
  code: Type.Optional(Type.String()),
  error: Type.Optional(Type.String()),
  error_description: Type.Optional(Type.String())
});

app.get<{
  Querystring: Static<typeof OAuthCallbackSchema>
}>("/oauth/callback", utils.JsonSchema({ querystring: OAuthCallbackSchema }), async (request, reply: FastifyReply) =>{
  if(!request.query.code) return reply.view("callback_error.ejs", { APP_NAME: env.APP_NAME, error: request.query.error, error_description: request.query.error_description });
  try{
    const resp = await fetch(`${env.LINE_NOTIFY_OAUTH_API_ENDPOINT}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: utils.createURLSearchParams({
        grant_type: "authorization_code",
        code: request.query.code,
        redirect_uri: env.LINE_NOTIFY_OAUTH_CALLBACK,
        client_id: env.LINE_NOTIFY_OAUTH_CLIENT_ID,
        client_secret: env.LINE_NOTIFY_OAUTH_CLIENT_SECRET
      })
    });

    const result = await resp.json();

    let subscribers = readFileSync("./data/subscribers.csv").toString();
    subscribers += `${result.access_token}\n`;
    writeFileSync("./data/subscribers.csv", subscribers);

    const res = utils.sendLineNotify({
      message: "\n登録されました。\n連携を解除する際は下記のリンクから行ってください\nhttps://notify-bot.line.me/my/"
    }, result.access_token);
    return reply.view("done.ejs", { APP_NAME: env.APP_NAME });
  }catch(e){
    return reply.code(401).view("token_error.ejs", { APP_NAME: env.APP_NAME, error: "Token invlid" })
  }
});

const ApiNotifySchema = Type.Object({
  message: Type.String({ minLength: 1, maxLength: 1000 }),
  imageThumbnail: Type.Optional(Type.String({ format: "uri" })),
  imageFullsize: Type.Optional(Type.String({ format: "uri" }))
});

app.post<{
  Body: Static<typeof ApiNotifySchema>
}>("/secure/api/notify", utils.JsonSchema({ body: ApiNotifySchema }), async (request, reply: FastifyReply) =>{
  const subscribers = parse(readFileSync("./data/subscribers.csv"));
  const joblist = subscribers.map((v: string[]) =>{
    return {
      name: "Notify",
      data: {
        token: v[0],
        msg: request.body
      }
    };
  });
  const jobs = await queues.deliver.addBulk(joblist);
  return { ok: true, message: "Message added jobs" };
});

app.get("/secure/dashbord/", async (_request: FastifyRequest, reply: FastifyReply) =>{
  const subscribers = parse(readFileSync("./data/subscribers.csv"));
  return reply.view("dashboard.ejs", {
    APP_NAME: env.APP_NAME,
    APP_VERSION: env.VERSION,
    subscribers: subscribers.length
  });
});

// Process
app.listen({ port: 3000, host: "0.0.0.0" }, (err, address) =>{
  if(err) throw console.error(err);
  console.log("[LISTEN ADDRESS]", address);
});

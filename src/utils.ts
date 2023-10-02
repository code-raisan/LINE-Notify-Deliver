import { FastifySchema } from "fastify";
import env from "./env";

const createURLSearchParams = (data: any): URLSearchParams =>{
  if(!data) return new URLSearchParams();
  const params = new URLSearchParams();
  Object.keys(data).map(v => params.append(v, data[v]));
  return params;
};

export default {
  JsonSchema: (schema: FastifySchema) => ({ schema: schema }),
  DefVal: (val: unknown, def: unknown): unknown => val?val:def,
  createURLSearchParams,
  sendLineNotify: async (data: {
    message: string,
    imageThumbnail?: string,
    imageFullsize?: string,
    notificationDisabled?: boolean
  }, token: string): Promise<void> =>{
    const response = await fetch(`${env.LINE_NOTIFY_API_ENDPOINT}/api/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`
      },
      body: createURLSearchParams(data)
    }).catch(e =>{
      throw e;
    });
    const res = await response.json();
    return res;
  }
};

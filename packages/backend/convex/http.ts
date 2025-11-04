import { httpRouter } from "convex/server";
import { getToken } from "./httpEndpoint/getToken";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { startEgress } from "./httpEndpoint/startEgress";

const http = httpRouter();
http.route({
    path: "/getToken",
    method: "GET",
    handler: getToken,
  });
http.route({
  path:"/startEgress",
  method:"POST",
  handler:startEgress
})
http.route({
    path: "/",
    method: "GET",
    handler:  httpAction(async (ctx, request) => {
        return new Response(JSON.stringify({ message: "Hello from Convex" } ), { status: 200 , headers: new Headers({
            "Access-Control-Allow-Origin": "http://localhost:3001",
            Vary: "origin",
          })});
      }),
  });
http.route({
    path: "/hello",
    method: "GET",
    handler:  httpAction(async (ctx, request) => {
        return new Response(JSON.stringify({ message: "Hello from samar" } ), { status: 200 , headers: new Headers({
            "Access-Control-Allow-Origin": "http://localhost:3001",
            Vary: "origin",
          })});
      }),
  });

authComponent.registerRoutes(http, createAuth);

export default http;

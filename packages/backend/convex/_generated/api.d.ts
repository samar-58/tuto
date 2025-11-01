/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as generateToken from "../generateToken.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as httpEndpoint_getToken from "../httpEndpoint/getToken.js";
import type * as privateData from "../privateData.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  generateToken: typeof generateToken;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "httpEndpoint/getToken": typeof httpEndpoint_getToken;
  privateData: typeof privateData;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};

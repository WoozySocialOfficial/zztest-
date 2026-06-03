import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Mounts Convex Auth's HTTP routes (token exchange, etc.).
auth.addHttpRoutes(http);

export default http;

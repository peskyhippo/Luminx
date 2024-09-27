import { serveDir } from "jsr:@std/http/file-server";
Deno.serve({}, serveDir);

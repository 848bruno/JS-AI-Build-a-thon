import { server } from "./server.js";

server.listen().then(() => {
  console.log("✅ MCP server is running at http://localhost:3000");
});

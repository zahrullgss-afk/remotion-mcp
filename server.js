import express from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "out");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PORT = process.env.PORT || 3000;

let bundlePromise = null;
function getBundle() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(__dirname, "src", "index.js"),
    });
  }
  return bundlePromise;
}

function baseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
}

function buildServer(req) {
  const server = new McpServer({ name: "remotion-mcp", version: "1.0.0" });

  server.tool(
    "render_video",
    "Render video animasi teks pendek dengan Remotion dan kembalikan URL file MP4.",
    {
      title: z.string().min(1).max(120).describe("Teks utama di video"),
      subtitle: z.string().max(200).optional().describe("Teks kecil di bawah judul"),
      seconds: z.number().min(2).max(15).default(5).describe("Durasi (detik)"),
      background: z.string().default("#0f172a").describe("Warna latar"),
      color: z.string().default("#ffffff").describe("Warna teks"),
    },
    async ({ title, subtitle, seconds, background, color }) => {
      try {
        const serveUrl = await getBundle();
        const fps = 30;
        const durationInFrames = Math.round(seconds * fps);
        const inputProps = { title, subtitle: subtitle || "", background, color };

        const composition = await selectComposition({
          serveUrl,
          id: "Intro",
          inputProps,
        });

        const id = crypto.randomUUID();
        const outputLocation = path.join(OUT_DIR, `${id}.mp4`);

        await renderMedia({
          composition: { ...composition, durationInFrames },
          serveUrl,
          codec: "h264",
          outputLocation,
          inputProps,
        });

        const url = `${baseUrl(req)}/files/${id}.mp4`;
        return { content: [{ type: "text", text: `Video selesai: ${url}` }] };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Gagal render: ${err.message}` }],
        };
      }
    }
  );

  return server;
}

const app = express();
app.use(express.json());
app.use("/files", express.static(OUT_DIR));

app.get("/", (_req, res) => res.send("Remotion MCP server aktif. Endpoint: /mcp"));

app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer(req);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

const methodNotAllowed = (_req, res) =>
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Remotion MCP berjalan di port ${PORT}`);
  getBundle().then(() => console.log("Bundle Remotion siap"));
});

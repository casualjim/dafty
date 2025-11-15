import { serve } from "bun";
import homepage from "./index.html";
import { getLayoutState, updateLayoutState, hashPath } from "./db";

const server = serve({
  hostname: "0.0.0.0",
  port: process.env.TEST_MODE ? 3001 : 3000,
  routes: {
    // ** HTML imports **
    // Bundle & route index.html to "/". This uses HTMLRewriter to scan
    // the HTML for `<script>` and `<link>` tags, runs Bun's JavaScript
    // & CSS bundler on them, transpiles any TypeScript, JSX, and TSX,
    // downlevels CSS with Bun's CSS parser and serves the result.
    "/": homepage,
    
    // API endpoint for layout state - handles both GET and POST
    "/api/layout": async (req) => {
      const url = new URL(req.url);
      const userId = req.headers.get("x-api-key") || 'default';
      
      if (req.method === "GET") {
        const path = url.searchParams.get("path") || "/";
        const deviceType = (url.searchParams.get("device") as 'mobile' | 'desktop') || 'desktop';
        const contextKey = hashPath(path, deviceType);
        
        let state = getLayoutState(contextKey, userId);
        
        // If no state exists for this context, create default state
        if (!state) {
          state = updateLayoutState(contextKey, {}, userId);
        }
        
        return Response.json(state);
      }
      
      if (req.method === "POST") {
        try {
          const body = await req.json();
          
          // Validate that body is an object
          if (typeof body !== 'object' || body === null || Array.isArray(body)) {
            return Response.json({ error: "Invalid request body" }, { status: 400 });
          }
          
          const path = body.path || "/";
          const deviceType = body.device || 'desktop';
          const contextKey = hashPath(path, deviceType);
          
          // Remove path and device from updates object
          const { path: _, device: __, ...updates } = body;
          
          const state = updateLayoutState(contextKey, updates, userId);
          return Response.json(state);
        } catch (error) {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
      }
      
      return new Response("Method not allowed", { 
        status: 405,
        headers: { "Allow": "GET, POST" }
      });
    },
  },

  // Enable development mode for:
  // - Detailed error messages
  // - Hot reloading (Bun v1.2.3+ required)
  development: true,
});

console.log(`Listening on ${server.url}`);
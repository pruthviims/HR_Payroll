import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  console.log("[SERVER] Starting server initialization...");
  try {
    const app = express();
    const PORT = process.env.PORT || 3000;

    console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
    console.log(`[SERVER] Port: ${PORT}`);

    // Security headers & HSTS for A+ rating (Production only)
    if (process.env.NODE_ENV === "production") {
      console.log("[SERVER] Applying production security headers (Helmet)...");
      app.use(helmet({
        contentSecurityPolicy: false, // Disable CSP for now to ensure Vite/React compatibility
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
      }));
    } else {
      console.log("[SERVER] Applying development security headers...");
      app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        hsts: false, // Disable HSTS in dev
      }));
    }

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    // --- API Routes ---

    // 0. System Initialization Secret Check
    app.post("/payroll/v1/initialize-sys", (req, res) => {
      const { secret } = req.body;
      const expectedSecret = process.env.PAYSLIP_SETUP_SECRET;

      console.log("[API] [initialize-sys] Received initialization request.");
      console.log(`[API] [initialize-sys] Expected Secret configured: ${expectedSecret ? "YES" : "NO"}`);

      if (!expectedSecret) {
        console.error("[API] [initialize-sys] ERROR: PAYSLIP_SETUP_SECRET is not configured in the environment.");
        return res.status(500).json({ error: "System configuration error: Secret not set." });
      }

      if (secret === expectedSecret) {
        console.log("[API] [initialize-sys] SUCCESS: Secret key verified successfully.");
        return res.json({ status: "success", message: "System secret verified." });
      } else {
        console.warn("[API] [initialize-sys] FAILURE: Invalid secret key provided.");
        return res.status(401).json({ error: "Invalid setup secret key." });
      }
    });

    // Health check that doesn't depend on anything
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
    });

    // 1. Tenant Detection & Mapping
    app.get("/api/tenant/detect", (req, res) => {
      const host = req.get('host') || '';
      const subdomain = host.split('.')[0];
      
      // In production, query Master DB for this subdomain
      // For preview, we'll return a mock mapping if subdomain is 'acme'
      if (subdomain === 'acme') {
        return res.json({
          id: 'tenant-acme-123',
          name: 'Acme Corp',
          databaseId: 'ai-studio-9398ac66-902a-4f8c-9da4-b5f4e8560ecc',
          logo: 'https://picsum.photos/seed/acme/200/200'
        });
      }

      res.json({ id: 'master', name: 'HR Payroll Central', databaseId: '(default)' });
    });

    // 2. Custom Auth: Login
    app.post("/api/auth/login", (req, res) => {
      try {
        // In production, this would be a Firestore query or a call to an identity service
        // For now, we rely on the frontend to authenticate with Firestore directly
        // or we implement the backend check here.
        
        res.status(401).json({ error: "Invalid credentials" });
      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      console.log("[SERVER] Starting Vite dev server integration...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.log("[SERVER] Production mode: Serving static files from /dist...");
      const distPath = path.join(process.cwd(), 'dist');
      
      // Serve static files from the root
      app.use(express.static(distPath));

      // Handle SPA routing for all paths
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER] Success! Listening on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("[SERVER] CRITICAL ERROR DURING STARTUP:", err);
    process.exit(1);
  }
}

startServer();

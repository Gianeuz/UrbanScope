#!/usr/bin/env python3
"""
UrbanScope Real Estate Platform - Server Runner
Executes the FastAPI application and hosts the entire platform.
"""

import os
import sys
# pyrefly: ignore [missing-import]
import uvicorn

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    display_host = "localhost" if host in ("127.0.0.1", "0.0.0.0") else host

    print("\n" + "=" * 60)
    print(" 🏙️  URBANSCOPE REAL ESTATE PLATFORM")
    print(" CD Miranda Realty & Miriam Lobren")
    print("=" * 60)
    print(f" ▸ Web Application:      http://{display_host}:{port}/")
    print(f" ▸ Sign-In Portal:       http://{display_host}:{port}/pages/auth/login.html")
    print(f"   Default Superadmin:  urbanscope.cvsu@gmail.com / urbanscope2026")
    print(f"   Default Admin:       admin.realestate@gmail.com / realestate2026")
    print(f" ▸ Swagger API Docs:    http://{display_host}:{port}/docs")
    print(f" ▸ ReDoc Documentation: http://{display_host}:{port}/redoc")
    print("=" * 60 + "\n")

    uvicorn.run("backend.app:app", host=host, port=port, reload=True)

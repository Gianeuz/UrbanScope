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

    print("\n" + "=" * 60)
    print(" 🏙️  URBANSCOPE REAL ESTATE PLATFORM")
    print(" CD Miranda Realty & Miriam Lobren")
    print("=" * 60)
    print(f" ▸ Web Application:      http://{host}:{port}/")
    print(f" ▸ Properties Catalog:  http://{host}:{port}/pages/properties/properties.html")
    print(f" ▸ Sign-In Portal:       http://{host}:{port}/pages/auth/login.html")
    print(f"   Default Superadmin:  urbanscope.cvsu@gmail.com / urbanscope2026")
    print(f"   Default Admin:       admin.realestate@gmail.com / realestate2026")
    print(f" ▸ Swagger API Docs:    http://{host}:{port}/docs")
    print(f" ▸ ReDoc Documentation: http://{host}:{port}/redoc")
    print("=" * 60 + "\n")

    uvicorn.run("backend.app:app", host=host, port=port, reload=True)

import PyInstaller.__main__
import os
import shutil
import sys

def build():
    # Define paths
    script_path = os.path.join("app", "main.py")
    dist_path = "dist"
    build_path = "build"
    
    # Clean previous builds
    if os.path.exists(dist_path):
        shutil.rmtree(dist_path)
    if os.path.exists(build_path):
        shutil.rmtree(build_path)
    
    # PyInstaller arguments
    # --onefile: self-contained binary for reliable sidecar use
    # --noconsole: no pop-up windows
    # --name: typical sidecar name format for Tauri
    args = [
        script_path,
        "--onefile",
        "--noconsole",
        "--name", f"api-{sys.platform}",
        "--clean",
        "--add-data", f"app{os.pathsep}app", # Include the app package
    ]
    
    PyInstaller.__main__.run(args)

if __name__ == "__main__":
    build()

ToolX - Image & Video Toolkit
A screenshot of the ToolX application interface.

A modern, all-in-one desktop application for Windows that provides a suite of powerful image and video processing tools, wrapped in a beautiful Fluent UI inspired by Windows 11.

✨ Features
This toolkit combines four powerful utilities into a single, easy-to-use application:

Find Best Image: Select a group of similar photos, and the app uses a scoring algorithm based on sharpness, contrast, and brightness to automatically find the best one.

Extract Frames: Load a video file, and the app will quickly extract frames, allowing you to save high-quality stills from your footage.

Image Upscaler: Enlarge images by 2x, 4x, or up to 8x their original size using high-quality Lanczos interpolation to maintain clarity.

Image Splitter: Split any image into a custom grid (e.g., 1x2 for a panorama or 2x2 for a profile grid) with just a few clicks.

🚀 Getting Started (For Users)
Go to the Releases page on the right side of the repository page.

Under the latest release, click on ToolX.exe to download the application.

Run the downloaded file. No installation is needed!

🛠️ Getting Started (For Developers)
This project uses Python with Eel for the backend and React with Fluent UI for the frontend.

Prerequisites
Python 3.8+

Node.js and npm

Installation & Setup
Clone the repository:

git clone [https://github.com/t-manojkumar/ToolX.git](https://github.com/t-manojkumar/ToolX.git)
cd ToolX

Set up the Python backend:

# Install Python dependencies
pip install -r requirements.txt

Set up the React frontend:

# Navigate to the web directory
cd web

# Install npm packages
npm install

Running in Development Mode
Build the React UI: From the web/ directory, run:

npm run build

Run the Python App: From the root project directory (ToolX/), run:

python app.py

Building the Executable
To package the application into a single .exe file, run the following command from the root directory:

python -m PyInstaller app.py --onefile --noconsole --add-data "web/build;web/build" --name "ToolX"

The final ToolX.exe will be located in the dist/ folder.

This application was built with the assistance of an AI model.

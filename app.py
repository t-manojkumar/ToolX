import eel
import os
import cv2
import numpy as np
from PIL import Image
import base64
import io
import shutil

# --- Application Setup ---
# Initialize Eel to use the 'web/build' folder for the UI
eel.init('web/build')

# Create a temporary directory for processing files if it doesn't exist
TEMP_DIR = "temp_processing"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# --- Helper Functions ---
def base64_to_cv2_image(base64_string):
    """Decodes a Base64 string into an OpenCV image."""
    # Remove the data URL prefix (e.g., "data:image/png;base64,")
    if "," in base64_string:
        base64_string = base64_string.split(',')[1]
    # Decode the string and convert to a NumPy array
    img_data = base64.b64decode(base64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def cv2_image_to_base64(image, extension=".png"):
    """Encodes an OpenCV image into a Base64 string."""
    _, buffer = cv2.imencode(extension, image)
    return f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"

def pil_image_to_base64(image, extension="PNG"):
    """Encodes a Pillow image into a Base64 string."""
    buffered = io.BytesIO()
    image.save(buffered, format=extension)
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

# --- Exposed Python Functions (Callable from JavaScript) ---

@eel.expose
def find_best_image(image_data_list):
    """
    Analyzes a list of Base64 encoded images and returns the best one.
    """
    print("Received request to find the best image.")
    scores = []
    
    # Weights for scoring (sharpness, contrast, brightness)
    weights = {'sharpness': 0.5, 'contrast': 0.3, 'brightness': 0.2}

    for index, b64_string in enumerate(image_data_list):
        # Decode image from Base64
        color_image = base64_to_cv2_image(b64_string)
        if color_image is None:
            continue
        gray_image = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)

        # Calculate quality metrics
        sharpness = cv2.Laplacian(gray_image, cv2.CV_64F).var()
        brightness = np.mean(gray_image)
        contrast = np.std(gray_image)
        
        scores.append({
            'index': index,
            'sharpness': sharpness,
            'brightness': brightness,
            'contrast': contrast,
            'original_b64': b64_string
        })

    if not scores:
        return {'error': 'Could not analyze any images.'}

    # Normalize scores to fairly compare them
    max_sharp = max(s['sharpness'] for s in scores) or 1
    max_bright = max(s['brightness'] for s in scores) or 1
    max_contrast = max(s['contrast'] for s in scores) or 1

    best_image = None
    max_overall_score = -1

    for s in scores:
        norm_sharp = s['sharpness'] / max_sharp
        norm_bright = s['brightness'] / max_bright
        norm_contrast = s['contrast'] / max_contrast
        
        # Ideal brightness is in the middle (0.5), not max.
        brightness_score = 1.0 - abs(norm_bright - 0.5) * 2

        # Calculate final weighted score
        overall_score = (
            norm_sharp * weights['sharpness'] +
            brightness_score * weights['brightness'] +
            norm_contrast * weights['contrast']
        )
        s['overall_score'] = overall_score
        
        if overall_score > max_overall_score:
            max_overall_score = overall_score
            best_image = s
            
    print(f"Best image found at index {best_image['index']} with score {max_overall_score:.3f}")
    return best_image

@eel.expose
def extract_frames_from_video(video_b64, filename):
    """
    Extracts frames from a video (sent as Base64), returns a list of frames as Base64.
    """
    print(f"Received request to extract frames from '{filename}'.")
    # Save the Base64 video to a temporary file
    video_path = os.path.join(TEMP_DIR, filename)
    if "," in video_b64:
        video_b64 = video_b64.split(',')[1]
    with open(video_path, "wb") as f:
        f.write(base64.b64decode(video_b64))

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {'error': 'Could not open video file.'}

    frames = []
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # We only return every Nth frame to avoid overwhelming the UI
        # For this example, let's take 1 frame per second (assuming 30fps)
        if frame_count % 30 == 0:
            frames.append(cv2_image_to_base64(frame))
        frame_count += 1
    
    cap.release()
    os.remove(video_path) # Clean up the temp file
    print(f"Extracted {len(frames)} frames.")
    return frames

@eel.expose
def upscale_image(image_b64, scale):
    """Upscales an image using Lanczos interpolation."""
    print(f"Received request to upscale image by {scale}x.")
    image = base64_to_cv2_image(image_b64)
    if image is None:
        return {'error': 'Could not decode image for upscaling.'}

    height, width = image.shape[:2]
    new_size = (int(width * scale), int(height * scale))
    
    upscaled = cv2.resize(image, new_size, interpolation=cv2.INTER_LANCZOS4)
    
    return cv2_image_to_base64(upscaled)

@eel.expose
def split_image(image_b64, rows, cols):
    """Splits an image into a grid of smaller images."""
    print(f"Received request to split image into {rows}x{cols} grid.")
    try:
        # Decode Base64 to a Pillow Image
        if "," in image_b64:
            image_b64 = image_b64.split(',')[1]
        img_data = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(img_data))
        
        img_width, img_height = img.size
        piece_width = img_width // cols
        piece_height = img_height // rows
        
        parts = []
        for r in range(rows):
            for c in range(cols):
                box = (c * piece_width, r * piece_height, (c + 1) * piece_width, (r + 1) * piece_height)
                piece = img.crop(box)
                parts.append(pil_image_to_base64(piece))
        
        print(f"Split image into {len(parts)} parts.")
        return parts
    except Exception as e:
        return {'error': f'Failed to split image: {e}'}


# --- Start Application ---
if __name__ == "__main__":
    print("Starting application... A window should appear shortly.")
    # Set the size of the application window and specify a random port
    eel.start('index.html', size=(1280, 800), port=0)
    # Clean up temp directory on exit
    shutil.rmtree(TEMP_DIR)
    print("Application closed.")


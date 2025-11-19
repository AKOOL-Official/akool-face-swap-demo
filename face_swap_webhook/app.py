from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from Crypto.Cipher import AES
from dotenv import load_dotenv
from flask_socketio import SocketIO, emit
from engineio.async_drivers import gevent
import base64
import json
import time
import os
import requests
import hashlib
from datetime import datetime

load_dotenv()

app = Flask(__name__)
# Allow all origins with CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Simplified SocketIO configuration
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='gevent',
    logger=True,
    engineio_logger=True,  # Add engine IO logging
    ping_timeout=5000,     # Increase ping timeout
    ping_interval=2500     # Adjust ping interval
)

# Store events temporarily in memory
events = []

def generate_msg_signature(client_id, timestamp, nonce, data_encrypt):
    """
    Generate SHA1 signature for webhook verification
    Signature = sha1(sort(clientId, timestamp, nonce, dataEncrypt))
    """
    # Sort parameters and join
    sorted_str = ''.join(sorted([str(client_id), str(timestamp), str(nonce), str(data_encrypt)]))
    # Calculate SHA1 hash
    hash_obj = hashlib.sha1(sorted_str.encode('utf-8'))
    return hash_obj.hexdigest()

def generate_aes_decrypt(data_encrypt, client_id, client_secret):
    """
    Decrypt webhook data using AES-CBC with PKCS7 padding
    - Key: clientSecret (16, 24, or 32 bytes for AES-128/192/256)
    - IV: clientId (first 16 bytes, padded with spaces if needed)
    - Mode: CBC
    - Padding: PKCS7
    """
    # Get the key and validate length
    aes_key = client_secret.encode('utf-8')
    key_len = len(aes_key)
    
    # Support AES-128 (16 bytes), AES-192 (24 bytes), or AES-256 (32 bytes)
    if key_len not in [16, 24, 32]:
        raise ValueError(f"clientSecret must be 16, 24, or 32 bytes for AES, got {key_len}")
    
    # Adjust key length if necessary (take first N bytes or pad)
    if key_len == 32:
        # AES-256
        aes_key = aes_key[:32]
        print(f"Using AES-256 (32 byte key)")
    elif key_len == 24:
        # AES-192
        aes_key = aes_key[:24]
        print(f"Using AES-192 (24 byte key)")
    elif key_len == 16:
        # AES-128
        aes_key = aes_key[:16]
        print(f"Using AES-128 (16 byte key)")
    elif key_len > 32:
        # Too long, truncate to 32 for AES-256
        aes_key = aes_key[:32]
        print(f"Key too long ({key_len} bytes), truncating to 32 for AES-256")
    elif key_len < 16:
        # Too short, this won't work
        raise ValueError(f"clientSecret too short: {key_len} bytes (minimum 16 required)")

    # IV must be exactly 16 bytes - pad with spaces (0x20) not null bytes
    # This matches the encryption side behavior
    iv = client_id.encode('utf-8')
    if len(iv) > 16:
        iv = iv[:16]
    elif len(iv) < 16:
        iv = iv + b' ' * (16 - len(iv))  # Pad with spaces, not null bytes

    print(f"Decryption config: key_length={len(aes_key)}, iv_length={len(iv)}")

    # Create cipher and decrypt
    cipher = AES.new(aes_key, AES.MODE_CBC, iv)
    encrypted_data = base64.b64decode(data_encrypt)
    decrypted_data = cipher.decrypt(encrypted_data)

    # Remove PKCS7 padding
    # The last byte tells us how many padding bytes there are
    try:
        padding_len = decrypted_data[-1]
        if padding_len > 16 or padding_len == 0:
            # Invalid padding
            raise ValueError(f"Invalid PKCS7 padding length: {padding_len}")
        
        # Verify all padding bytes are the same
        padding_bytes = decrypted_data[-padding_len:]
        if not all(b == padding_len for b in padding_bytes):
            raise ValueError("Invalid PKCS7 padding bytes")
        
        # Remove padding and decode
        return decrypted_data[:-padding_len].decode('utf-8')
    except (IndexError, ValueError) as e:
        print(f"Padding error: {e}")
        print(f"Decrypted data length: {len(decrypted_data)}")
        print(f"Last 16 bytes (hex): {decrypted_data[-16:].hex()}")
        raise ValueError(f"Failed to remove PKCS7 padding: {e}")

@app.route('/test-app', methods=['GET'])
def test_app():
    """Test endpoint to verify server is running"""
    socketio.emit('message', {'data': 'Hello, World!'})
    return jsonify({"message": "Hello, World!"}), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "face-swap-webhook",
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/api/webhook', methods=['POST'])
def webhook():
    print("Webhook received")
    try:
        data = request.get_json()
        print("JSON data received:", data)

        # Extract webhook parameters
        signature = data.get('signature')
        encrypted_data = data.get('dataEncrypt')
        timestamp = data.get('timestamp')
        nonce = data.get('nonce')
        
        client_id = os.getenv('CLIENT_ID')
        client_secret = os.getenv('CLIENT_SECRET')

        if not all([signature, encrypted_data, timestamp, nonce, client_id, client_secret]):
            return jsonify({"error": "Missing required parameters"}), 400

        # Verify signature first
        calculated_signature = generate_msg_signature(client_id, timestamp, nonce, encrypted_data)
        print(f"Signature verification: received={signature}, calculated={calculated_signature}")
        
        if signature != calculated_signature:
            print("Signature verification failed!")
            return jsonify({"error": "Invalid signature"}), 401

        print("✅ Signature verified successfully")

        # Decrypt the data
        decrypted_data = generate_aes_decrypt(encrypted_data, client_id, client_secret)
        print("Decrypted Data:", decrypted_data)
        decrypted_json = json.loads(decrypted_data)

        # Enhanced status handling
        status = decrypted_json.get('status')
        if status is None:
            return jsonify({"error": "Missing status in payload"}), 400

        # Map status codes to meaningful messages
        status_messages = {
            1: "Processing started",
            2: "Processing in progress",
            3: "Processing completed",
            4: "Processing failed"
        }

        message = {
            'type': 'error' if status == 4 else 'status_update',
            'status': status,
            'message': status_messages.get(status, "Unknown status"),
            'data': decrypted_json
        }

        # Emit to all connected clients
        socketio.emit('faceswap_status', message)
        
        return jsonify({
            "success": True,
            "message": "Webhook processed successfully"
        }), 200

    except Exception as e:
        print(f"Error processing webhook: {e}")
        socketio.emit('faceswap_status', {
            'type': 'error',
            'message': f"Error processing webhook: {str(e)}"
        })
        return jsonify({"error": str(e)}), 400


@socketio.on('connect')
def handle_connect():
    print("Client connected")
    emit('message', {'data': 'Connected to server', 'type': 'info'})

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

# Helper function to get auth headers from request
def get_forwarding_headers():
    """Get authentication headers to forward to Akool API"""
    # Check for Bearer token first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return {'Authorization': auth_header}
    
    # Check for x-api-key
    api_key = request.headers.get('x-api-key')
    if api_key:
        return {'x-api-key': api_key}
    
    return None

# Proxy endpoints to avoid CORS issues
@app.route('/api/proxy/quota/info', methods=['GET'])
def proxy_quota_info():
    """Proxy endpoint for credit info to avoid CORS"""
    auth_headers = get_forwarding_headers()
    if not auth_headers:
        return jsonify({"error": "Missing authentication header (x-api-key or Authorization)"}), 400
    
    try:
        response = requests.get(
            'https://openapi.akool.com/api/open/v3/faceswap/quota/info',
            headers=auth_headers
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/detect', methods=['POST'])
def proxy_face_detect():
    """Proxy endpoint for face detection to avoid CORS"""
    auth_headers = get_forwarding_headers()
    if not auth_headers:
        return jsonify({"error": "Missing authentication header (x-api-key or Authorization)"}), 400
    
    try:
        data = request.get_json()
        
        # Log request (without full base64 to avoid cluttering logs)
        log_data = {k: ('[base64 data]' if k == 'img' and v else v) for k, v in data.items()}
        print(f"Face detect request: {log_data}")
        
        headers = {**auth_headers, 'Content-Type': 'application/json'}
        response = requests.post(
            'https://sg3.akool.com/detect',
            json=data,
            headers=headers
        )
        
        print(f"Face detect response status: {response.status_code}")
        return jsonify(response.json()), response.status_code
    except Exception as e:
        print(f"Face detect error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/faceswap/v3/image', methods=['POST'])
def proxy_faceswap_v3_image():
    """Proxy endpoint for v3 image face swap to avoid CORS"""
    auth_headers = get_forwarding_headers()
    if not auth_headers:
        return jsonify({"error": "Missing authentication header (x-api-key or Authorization)"}), 400
    
    try:
        data = request.get_json()
        headers = {**auth_headers, 'Content-Type': 'application/json'}
        response = requests.post(
            'https://openapi.akool.com/api/open/v3/faceswap/highquality/specifyimage',
            json=data,
            headers=headers
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/faceswap/v4/image', methods=['POST'])
def proxy_faceswap_v4_image():
    """Proxy endpoint for v4 image face swap to avoid CORS"""
    auth_headers = get_forwarding_headers()
    if not auth_headers:
        return jsonify({"error": "Missing authentication header (x-api-key or Authorization)"}), 400
    
    try:
        data = request.get_json()
        headers = {**auth_headers, 'Content-Type': 'application/json'}
        response = requests.post(
            'https://openapi.akool.com/api/open/v4/faceswap/faceswapByImage',
            json=data,
            headers=headers
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/faceswap/v3/video', methods=['POST'])
def proxy_faceswap_v3_video():
    """Proxy endpoint for v3 video face swap to avoid CORS"""
    auth_headers = get_forwarding_headers()
    if not auth_headers:
        return jsonify({"error": "Missing authentication header (x-api-key or Authorization)"}), 400
    
    try:
        data = request.get_json()
        headers = {**auth_headers, 'Content-Type': 'application/json'}
        response = requests.post(
            'https://openapi.akool.com/api/open/v3/faceswap/highquality/specifyvideo',
            json=data,
            headers=headers
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/getToken', methods=['POST'])
def proxy_get_token():
    """Proxy endpoint for getting token from credentials"""
    try:
        data = request.get_json()
        response = requests.post(
            'https://openapi.akool.com/api/open/v3/getToken',
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run with debug mode
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=3008, 
        debug=True,
        allow_unsafe_werkzeug=True
    )


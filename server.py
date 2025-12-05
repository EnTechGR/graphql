from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

API_BASE = "https://platform.zone01.gr"

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# CORS-friendly auth endpoint
@app.route('/api/auth/signin', methods=['POST', 'OPTIONS'])
def signin():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        auth_header = request.headers.get('Authorization')
        
        response = requests.post(
            f'{API_BASE}/api/auth/signin',
            headers={
                'Authorization': auth_header,
                'Content-Type': 'application/json'
            }
        )
        
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CORS-friendly GraphQL endpoint
@app.route('/api/graphql', methods=['POST', 'OPTIONS'])
def graphql_proxy():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        auth_header = request.headers.get('Authorization')
        
        response = requests.post(
            f'{API_BASE}/api/graphql-engine/v1/graphql',
            headers={
                'Authorization': auth_header,
                'Content-Type': 'application/json'
            },
            json=request.get_json()
        )
        
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting CORS proxy server on http://localhost:5000")
    app.run(debug=True, port=5000)

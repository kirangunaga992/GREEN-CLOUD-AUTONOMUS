# Serves the user portal HTML
from flask import send_from_directory
import os

def register_portal_routes(app):
    @app.route('/')
    def portal_home():
        portal_path = os.path.join(os.path.dirname(__file__), 'static', 'index.html')
        if os.path.exists(portal_path):
            return send_from_directory(os.path.dirname(portal_path), 'index.html')
        return "Portal not found", 404

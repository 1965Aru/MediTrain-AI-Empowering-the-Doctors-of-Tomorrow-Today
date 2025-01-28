import json
import logging
import os
from flask import Flask, render_template, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from groq import Groq

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

def load_conversations():
    try:
        with open("conversations.json", "r") as f:
            conversations = json.load(f)
            return {
                conv.get("Patient", "").lower(): conv.get("Doctor", "")
                for conv in conversations
            }
    except FileNotFoundError:
        logger.warning("conversations.json not found.")
        return {}
    except json.JSONDecodeError:
        logger.error("Invalid JSON in conversations.json")
        return {}

def create_app():
    app = Flask(__name__)
    
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["100 per day"],
        storage_uri="memory://"
    )
    
    API_KEY = os.getenv("GROQ_API_KEY")
    MODEL_NAME = os.getenv("GROQ_MODEL", "llama3-70b-8192")
    
    if not API_KEY:
        logger.error("GROQ_API_KEY is not set in environment variables")
        raise ValueError("GROQ_API_KEY is required")
    
    client = Groq(api_key=API_KEY)
    
    system_prompt = {
        "role": "system",
        "content": (
            "You are Meditrain AI, a professional healthcare assistant. "
            "Provide accurate, empathetic medical information. Always recommend "
            "consulting a healthcare professional for precise diagnosis and treatment."
        )
    }
    
    conversations = load_conversations()
    
    @app.route("/")
    def home():
        return render_template("index.html")
    
    @app.route("/chat", methods=["POST"])
    @limiter.limit("20 per minute")
    def chat():
        try:
            data = request.get_json()
            query = data.get("query", "").strip().lower()
            
            if not query:
                return jsonify({"error": "No query provided"}), 400
            
            predefined_response = conversations.get(query)
            if predefined_response:
                return jsonify({"response": predefined_response})
            
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        system_prompt,
                        {"role": "user", "content": query}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                ai_response = response.choices[0].message.content
                return jsonify({"response": ai_response})
            except Exception as e:
                logger.error(f"Groq API error: {e}")
                return jsonify({"response": "Service temporarily unavailable. Please try again later."}), 500
        except Exception as e:
            logger.error(f"Unexpected error in chat route: {e}")
            return jsonify({"error": "An unexpected error occurred"}), 500
    
    @app.route("/rate", methods=["POST"])
    @limiter.limit("10 per minute")
    def rate_experience():
        try:
            data = request.get_json()
            username = data.get("username", "").strip()
            rating = data.get("rating")
            feedback = data.get("feedback", "").strip()
            
            if not username or not rating or not (1 <= int(rating) <= 5):
                return jsonify({"error": "Invalid input"}), 400
            
            logger.info(f"Rating: {rating}/5 from {username}")
            if feedback:
                logger.info(f"Feedback: {feedback}")
            
            return jsonify({"message": "Feedback received. Thank you!"}), 200
        except Exception as e:
            logger.error(f"Feedback submission error: {e}")
            return jsonify({"error": "Feedback submission failed"}), 500
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Too many requests. Please wait and try again."}), 429
    
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
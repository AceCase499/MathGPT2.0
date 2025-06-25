from flask import Flask, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

#SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "https://mpgvjrzxvizjnyxdyntp.supabase.co"
SUPABASE_URL = "https://mpgvjrzxvizjnyxdyntp.supabase.co"
#SUPABASE_API_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZ3Zqcnp4dml6am55eGR5bnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTQxNzgsImV4cCI6MjA2NjI5MDE3OH0.CT8NQas6sb8gXAE4YM-3xKP1tvo2d5fg8pVl39-xjME"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZ3Zqcnp4dml6am55eGR5bnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTQxNzgsImV4cCI6MjA2NjI5MDE3OH0.CT8NQas6sb8gXAE4YM-3xKP1tvo2d5fg8pVl39-xjME"

@app.route("/data", methods=["GET"])
def get_data():
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
    }

    url = f"{SUPABASE_URL}/rest/v1/FirstTable"

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch data", "details": response.text}), response.status_code

    return jsonify(response.json())

if __name__ == "__main__":
    app.run(debug=True)

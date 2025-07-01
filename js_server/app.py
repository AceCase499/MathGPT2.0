from flask import Flask, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

SUPABASE_URL = ""
SUPABASE_API_KEY = ""

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

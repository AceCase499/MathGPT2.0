from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
import os
from supabase import create_client

app = Flask(__name__)
CORS(app)
url = os.environ.get("NEXT_PUBLIC_JERRODS_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_JERRODS_SUPABASE_ANONKEY")
supabase = create_client(url, key)

# In-memory array to hold user data
users = []

@app.route('/getUsers', methods=['GET'])
def get_users():
    return jsonify(users)



@app.route('/addUser', methods=['POST'])
def add_user():
    data = request.get_json()
    name = data.get('name')
    age = data.get('age')
    
    if not name or not age:
        return jsonify({"error": "Name and age are required"}), 400
    
    users.append({'name': name, 'age': age})
    return jsonify(users), 201



@app.route('/addToSupa', methods=['POST'])
def addToSupabase():
    data = request.get_json()
    usr = data.get('usr')
    pwd = data.get('pwd')
    
    if not usr or not pwd:
        return jsonify("An error occurred"), 400
    try:
        response = (
        supabase.table("publicTable")
        .insert([{"username": usr, "password": pwd}])
        .execute()
        )
        """ if response.status_code != 200:
            return jsonify({"error": "Failed to fetch data", "details": response.text}), response.status_code """
        
    except Exception as exception:
        return exception
    return jsonify(response.text)

if __name__ == '__main__':
    app.run(debug=True)

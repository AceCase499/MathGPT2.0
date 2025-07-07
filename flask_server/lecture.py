from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from datetime import datetime
import uuid
from flask import Blueprint

client = OpenAI(api_key="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")

# Create a Flask application object
lecture_bp = Blueprint('lecture', __name__)

# Saving the context of each user's conversation
# Can be replaced by the database
lecture_store = {}

# Create a endpoint
@lecture_bp.route('/mathgpt', methods=['GET'])
def start_lecture():
    session_id = session_id = str(uuid.uuid4())  # unique session
    # Extract parameters from the URL passed from the front end
    topic = request.args.get('topic')

    if not topic:
        return 'Please give a topic', 400

    prompt = f"Give a multi-paragraph lecture on: {topic}"
    
    messages = [{"role": "user", "content": prompt}]
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    content = response.choices[0].message.content
    messages.append({"role": "assistant", "content": content})
    
    lecture_store[session_id] = {
        "topic": topic,
        "messages": messages,
        "is_done": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    return jsonify({"session_id": session_id, "lecture": content})


@lecture_bp.route('/mathgpt/followup', methods=['POST'])
def followup():
    data = request.json
    session_id = data.get('session_id')
    question = data.get('question')

    session = lecture_store.get(session_id)
    if not session:
        return 'Session not found', 404
    if session['is_done']:
        return 'Lecture is marked complete. No more questions allowed.', 403

    session['messages'].append({"role": "user", "content": question})
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=session['messages']
    )
    answer = response.choices[0].message.content
    session['messages'].append({"role": "assistant", "content": answer})
    session['updated_at'] = datetime.utcnow()

    return jsonify({"answer": answer})


# TC7.3: mark lecture as done
@lecture_bp.route('/mathgpt/complete', methods=['POST'])
def complete():
    data = request.json
    session_id = data.get('session_id')
    session = lecture_store.get(session_id)
    if not session:
        return 'Session not found', 404
    session['is_done'] = True
    return jsonify({"message": "Lecture marked as complete"})


# TC7.4 save past lecture data
@lecture_bp.route('/mathgpt/session', methods=['GET'])
def get_session():
    session_id = request.args.get('session_id')
    session = lecture_store.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({
        "topic": session["topic"],
        "messages": session["messages"],
        "is_done": session["is_done"]
    })


# TC7.5: get lecture history list
@lecture_bp.route('/mathgpt/lectures', methods=['GET'])
def list_lectures():
    result = []
    for session_id, info in lecture_store.items():
        result.append({
            "session_id": session_id,
            "topic": info["topic"],
            "created_at": info["created_at"].isoformat(),
            "updated_at": info["updated_at"].isoformat()
        })
    return jsonify(result)


# TC7.6: rename a lecture
@lecture_bp.route('/mathgpt/rename', methods=['POST'])
def rename():
    data = request.json
    session_id = data.get('session_id')
    new_title = data.get('new_title')

    session = lecture_store.get(session_id)
    if not session:
        return 'Session not found', 404
    session['topic'] = new_title
    session['updated_at'] = datetime.utcnow()
    return jsonify({"message": "Lecture renamed"})


# TC7.7: delete a lecture
@lecture_bp.route('/mathgpt/delete', methods=['POST'])
def delete():
    data = request.json
    session_id = data.get('session_id')

    if session_id in lecture_store:
        del lecture_store[session_id]
        return jsonify({"message": "Lecture deleted"})
    return 'Session not found', 404

# show on the front end
from flask import send_from_directory
@lecture_bp.route('/home')
def frontend():
    return render_template('home.html')
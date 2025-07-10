import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, Blueprint
from openai import OpenAI
from datetime import datetime
import uuid
from database import engine, Lectures, LectureChat
from sqlalchemy.orm import Session

# Automatically read the .env file in the root directory.
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Create a Flask application object
problem_bp = Blueprint('problem', __name__)

# Stores for problems and lectures
problem_sessions = {}


# TC8.1 & TC8.2 - Generate problem from topic or lecture
@problem_bp.route('/mathgpt/problem/start', methods=['POST'])
def start_problem():
    data = request.json
    mode = data.get('mode', 'topic')  # "topic" or "lecture"
    topic = data.get('topic')
    lecture_id = data.get('lecture_session_id')

    if mode == 'topic' and not topic:
        return 'Missing topic', 400
    if mode == 'lecture':
        with Session(engine) as session:
            
            lecture = session.query(Lectures).filter_by(id=lecture_id).first()
            if lecture is None:
                return 'Lecture session not found', 404

            last_msg = (
                session.query(LectureChat)
                .filter_by(lecture_id=lecture_id)
                .order_by(LectureChat.timestamp.desc())
                .first()
            )
            
            lecture_text = last_msg.message if last_msg else lecture.content
            topic = lecture.topic

        prompt = (
            "You are a math instructor. Based on the following lecture content, "
            "generate one challenging math problem. Respond with:\n"
            "### Problem\n### Solution\n### Hint\n\n"
            f"[Lecture Content]\n{lecture_text}"
        )
    else:
        prompt = (
            f"You are a math instructor. Create a challenging math problem on: {topic}.\n"
            "Return a clean, well-formatted markdown response without using bold labels like 'Problem Statement' or 'Step-by-step'.\n"
            "Use the following format, and keep it readable:\n\n"
            "### Problem\n"
            "<problem content if needed>\n\n"
            "### Solution\n"
            "<solution steps, clearly explained>\n\n"
            "### Hint\n"
            "<a helpful hint>"
        )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    content = response.choices[0].message.content

    if "### Solution" not in content:
        return f'Invalid format: missing solution section. Raw output:\n{content}', 500

    parts = content.split("### Solution")
    if len(parts) < 2:
        return 'Invalid format: missing solution section', 500
    question = parts[0].strip()

    solution_and_hint = parts[1].split("### Hint")
    solution = solution_and_hint[0].strip()
    hint = solution_and_hint[1].strip() if len(solution_and_hint) > 1 else "No hint provided"

    session_id = str(uuid.uuid4())
    problem_sessions[session_id] = {
        "title": topic,
        "topic": topic,
        "question": question,
        "solution": solution,
        "hint": hint,
        "user_answer": None,
        "followups": [],
        "is_done": False,
        "created_at": datetime.utcnow(),
        "source_type": mode,
        "source_ref": lecture_id if mode == "lecture" else None
    }

    return jsonify({"session_id": session_id, "question": question})


# TC8.3 - Return hint
@problem_bp.route('/mathgpt/problem/hint', methods=['POST'])
def get_hint():
    data = request.json
    session_id = data.get('session_id')
    session = problem_sessions.get(session_id)
    if not session:
        return 'Session not found', 404
    return jsonify({"hint": session["hint"]})


# TC8.4 - Return step-by-step solution
@problem_bp.route('/mathgpt/problem/solution', methods=['POST'])
def get_solution():
    data = request.json
    session_id = data.get('session_id')
    session = problem_sessions.get(session_id)
    if not session:
        return 'Session not found', 404
    return jsonify({"solution": session["solution"]})


# TC8.5 - Submit answer and get feedback
@problem_bp.route('/mathgpt/problem/answer', methods=['POST'])
def submit_answer():
    data = request.json
    session_id = data.get('session_id')
    user_answer = data.get('answer')
    session = problem_sessions.get(session_id)
    if not session:
        return 'Session not found', 404

    session["user_answer"] = user_answer

    judge_prompt = (
        f"Problem: {session['question']}\n"
        f"User Answer: {user_answer}\n"
        f"Correct Solution: {session['solution']}\n"
        "Evaluate the user answer. Is it correct or incorrect? Provide a short explanation."
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": judge_prompt}]
    )
    feedback = response.choices[0].message.content
    return jsonify({"feedback": feedback})


# TC8.6 - Follow-up questions
@problem_bp.route('/mathgpt/problem/followup', methods=['POST'])
def followup():
    data = request.json
    session_id = data.get('session_id')
    question = data.get('question')
    session = problem_sessions.get(session_id)
    if not session:
        return 'Session not found', 404

    chat = [
        {"role": "user", "content": f"The problem was: {session['question']}"},
        {"role": "assistant", "content": session["solution"]},
        {"role": "user", "content": question}
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=chat
    )
    answer = response.choices[0].message.content
    session["followups"].append({"q": question, "a": answer})
    return jsonify({"answer": answer})


# TC8.7 - End session
@problem_bp.route('/mathgpt/problem/complete', methods=['POST'])
def complete():
    data = request.json
    session_id = data.get('session_id')
    session = problem_sessions.get(session_id)
    if not session:
        return 'Session not found', 404
    session["is_done"] = True
    return jsonify({"message": "Session marked complete"})


# TC8.8 - Rename session
@problem_bp.route('/mathgpt/problem/rename', methods=['POST'])
def rename():
    data = request.json
    session_id = data.get('session_id')
    new_title = data.get('new_title')
    session = problem_sessions.get(session_id)
    if not session:
        return 'Session not found', 404
    session['title'] = new_title
    return jsonify({"message": "Session title updated"})


# TC8.9 - Delete session
@problem_bp.route('/mathgpt/problem/delete', methods=['POST'])
def delete():
    data = request.json
    session_id = data.get('session_id')
    if session_id in problem_sessions:
        del problem_sessions[session_id]
        return jsonify({"message": "Session deleted"})
    return 'Session not found', 404


# List all sessions
@problem_bp.route('/mathgpt/problem/list', methods=['GET'])
def list_problems():
    result = []
    for sid, s in problem_sessions.items():
        result.append({
            "session_id": sid,
            "title": s.get("title", s["topic"]),
            "topic": s["topic"],
            "source_type": s.get("source_type"),
            "created_at": s["created_at"].isoformat()
        })
    return jsonify(result)


# show on the front end
@problem_bp.route('/problem_page')
def frontend():
    return render_template('problem.html')

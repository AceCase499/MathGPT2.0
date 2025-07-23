from flask import request, jsonify, Blueprint
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import engine, Student, Problem_Sessions, User_Login
import random
import bcrypt
from openai import OpenAI
import os
import math
import json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

assessment_bp = Blueprint('assessment', __name__)

def ask_gpt(prompt, model="gpt-4o", max_tokens=700, temperature=0.7):
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content.strip()

# Diagnostic early termination logic, can be expanded (such as database marking)
def end_assessment(reason="terminated"):
    return jsonify({
        "status": "terminated",
        "reason": reason
    }), 200

# IRT
def irt_probability(theta, b, a=1.0):
    return 1 / (1 + math.exp(-a * (theta - b)))

def update_theta(theta, correct, b, a=1.0, lr=0.1):
    p = irt_probability(theta, b, a)
    grad = a * (correct - p)
    return theta + lr * grad

def difficulty_to_b(difficulty):
    if difficulty == "easy":
        return -1.0
    elif difficulty == "medium":
        return 0.0
    elif difficulty == "hard":
        return 1.0
    return 0.0


# This route selects a random question from the diagnostic set
@assessment_bp.route('/skill_assessment/pick_problem', methods=['POST'])
def pick_problem():
    diagnostic = request.json.get('diagnostic')
    confidence = request.json.get('confidence', None)  # Optional: To be used for regulating difficulty in the future
    subtopic = random.choice(list(diagnostic.keys()))
    question = random.choice(diagnostic[subtopic])
    return jsonify({"subtopic": subtopic, "problem": question})

# This route evaluates a student's answer using GPT and returns 'Correct' or 'Incorrect'
@assessment_bp.route('/skill_assessment/submit_solution', methods=['POST'])
def submit_solution():
    question = request.json.get("question")
    student_answer = request.json.get("answer")
    prompt = f"""
You are an AI grader. Determine whether the student's answer is correct.
Question: {question}\nStudent's Answer: {student_answer}\nRespond with only 'Correct' or 'Incorrect'.
"""
    try:
        judgment = ask_gpt(prompt, max_tokens=10)
        return jsonify({"result": judgment.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# This route generates a study plan based on the student's mastery report
@assessment_bp.route('/skill_assessment/study_plan', methods=['POST'])
def study_plan():
    mastery = request.json.get('mastery')
    prompt = f"""
You are a tutoring assistant. Given the student's mastery per subtopic: {mastery}, 
generate a detailed study plan to help the student improve to full mastery.
"""
    try:
        plan = ask_gpt(prompt, max_tokens=700)
        return jsonify({"study_plan": plan})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# This route accepts confidence feedback input from students (placeholder)
@assessment_bp.route('/skill_assessment/confidence_feedback', methods=['POST'])
def confidence_feedback():
    return jsonify({"status": "received"})


# This route provides a short explanation (micro-lecture) for a given question and student's answer
@assessment_bp.route('/skill_assessment/submit_feedback', methods=['POST'])
def submit_feedback():
    question = request.json.get("question")
    answer = request.json.get("answer")
    prompt = f"""
Give a short, clear explanation (less than 120 words) for the following math question.
Question: {question}\nStudent's Answer: {answer}
"""
    try:
        explanation = ask_gpt(prompt, max_tokens=150)
        return jsonify({"micro_lecture": explanation, "next_button": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# This route provides the current privacy settings for the assessment system
@assessment_bp.route('/skill_assessment/privacy_settings', methods=['GET'])
def privacy_settings():
    return jsonify({
        "data_retention_days": 45,
        "pseudonymized": True,
        "delete_token": "delete_user(uuid)"
    })

# This route returns a student's progress report based on stored mastery data
@assessment_bp.route('/skill_assessment/progress_report', methods=['GET'])
def progress_report():
    student_id = request.args.get('student_id')
    with Session(engine) as session:
        student = session.get(Student, student_id)
        if student:
            return jsonify({"progress": student.progress_percentage})
        return jsonify({"error": "Student not found"}), 404


# This route deletes a user's login and associated student record
@assessment_bp.route('/delete_user', methods=['POST'])
def delete_user():
    user_id = request.json.get("user_id")
    with Session(engine) as session:
        user_login = session.get(User_Login, user_id)
        student = session.get(Student, user_id)
        if student:
            session.delete(student)
        if user_login:
            session.delete(user_login)
        session.commit()
    return jsonify({"status": "User deleted"})


# This route creates a new user with hashed password for secure authentication
@assessment_bp.route('/create_user_secure', methods=['POST'])
def create_user_secure():
    username = request.form.get('username')
    password = request.form.get('password')
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    with Session(engine) as session:
        if session.query(User_Login).filter_by(username=username).first():
            return "Username already exists", 400
        new_login = User_Login(
            id=None,
            username=username,
            password=hashed_pw
        )
        session.add(new_login)
        session.commit()
    return "User securely created"


# New endpoint to support spaced re-check based on mastery (FR-20-10)
@assessment_bp.route('/skill_assessment/reassessment_schedule', methods=['POST'])
def reassessment_schedule():
    mastery = request.json.get('mastery', {})
    low_mastery = sorted([(k, v) for k, v in mastery.items() if v < 60], key=lambda x: x[1])[:5]
    schedule = [f"Day {i+1}: {topic}" for i, (topic, _) in enumerate(low_mastery)]
    return jsonify({"schedule": schedule})


# Add IRT-based mastery scoring with termination logic (FR-20-2, FR-20-4)
@assessment_bp.route('/skill_assessment/rate_diagnostic', methods=['POST'])
def rate_diagnostic():
    answers = request.json.get('answers')
    student_id = request.json.get('student_id')
    max_questions = request.json.get('max_questions', 10)
    confidence_band = request.json.get('confidence_band', 3)
    topic_stats = {}
    all_thetas = []

    for item in answers:
        subtopic = item.get('subtopic')
        correct = 1 if item.get('correct') else 0
        difficulty = item.get('difficulty', 'medium')
        b = difficulty_to_b(difficulty)

        if subtopic not in topic_stats:
            topic_stats[subtopic] = {"theta": 0.0, "count": 0}

        old_theta = topic_stats[subtopic]["theta"]
        new_theta = update_theta(old_theta, correct, b)
        topic_stats[subtopic]["theta"] = new_theta
        topic_stats[subtopic]["count"] += 1
        all_thetas.append(new_theta)

    mastery_report = {
        key: round(100 * irt_probability(value["theta"], 0))
        for key, value in topic_stats.items()
    }


    # Check for early stopping based on confidence band
    if all_thetas:
        avg = sum(all_thetas) / len(all_thetas)
        spread = max(all_thetas) - min(all_thetas)
        if spread * 50 <= confidence_band:
            return end_assessment("Confidence band threshold reached.")

    total_count = sum(v["count"] for v in topic_stats.values())
    if total_count >= max_questions:
        return end_assessment("Maximum question limit reached.")

    try:
        with Session(engine) as session:
            student = session.get(Student, student_id)
            if student:
                student.progress_percentage = json.dumps(mastery_report)
                session.commit()
        return jsonify(mastery_report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Teacher config cache
teacher_configs = {}

# Endpoint to receive teacher configuration (FR-20-7)
@assessment_bp.route('/skill_assessment/teacher_config', methods=['POST'])
def teacher_config():
    config = request.json
    teacher_id = config.get('teacher_id')
    if teacher_id:
        teacher_configs[teacher_id] = config
    return jsonify({"status": "saved", "config": config})


# Apply teacher config to prompt generation (FR-20-7)
@assessment_bp.route('/skill_assessment/diagnostic_test', methods=['POST'])
def diagnostic_test():
    topic = request.json.get('topic')
    grade = request.json.get('grade', 'K-12')
    teacher_id = request.json.get('teacher_id')
    config = teacher_configs.get(teacher_id, {})

    difficulty_profile = config.get('difficulty_profile', 'balanced')
    time_per_item = config.get('time_per_item', 'default')
    hint_enabled = config.get('hint_enabled', True)
    stop_rule = config.get('stop_rule', 'default')

    prompt = f"""
You are a math expert. Generate diagnostic questions for topic \"{topic}\" at grade {grade} level.
Follow this structure: topic > subtopic > subsubtopic.
Include 3 questions per subsubtopic. Each group should have:
- One easy question, one medium question, one hard question
Teacher config:
- Difficulty profile: {difficulty_profile}
- Time per item: {time_per_item} seconds
- Hints enabled: {hint_enabled}
- Stop rule: {stop_rule}
Return the result as a JSON object:
{{
  "Topic > Subtopic > Subsubtopic": [
    {{"difficulty": "easy", "question": "..."}},
    {{"difficulty": "medium", "question": "..."}},
    {{"difficulty": "hard", "question": "..."}}
  ]
}}
"""
    try:
        result = ask_gpt(prompt, max_tokens=1000)
        return result
    except Exception as e:
        return jsonify({"error": str(e)}), 500



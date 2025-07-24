from flask import request, jsonify, Blueprint
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import engine, Student, User_Login, User, DiagnosticProblem
import random
import bcrypt
from openai import OpenAI
import os
import math
import json
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

assessment_bp = Blueprint('assessment', __name__)

def ask_gpt(prompt, model="gpt-4o", max_tokens=2000, temperature=1.0):
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
    student_id = request.json.get('student_id')
    with Session(engine) as session:
        next_question = session.query(DiagnosticProblem)\
            .filter_by(student_id=student_id, is_served=False)\
            .order_by(DiagnosticProblem.id)\
            .first()

        if not next_question:
            return jsonify({"status": "completed"}), 200

        next_question.is_served = True
        session.commit()

        # Construct response based on type
        problem_payload = {
            "question": next_question.question,
            "type": next_question.type,
            "difficulty": next_question.difficulty,
        }

        if next_question.type == "mcq":
            problem_payload["options"] = json.loads(next_question.options) if next_question.options else None
        elif next_question.type in ["proof", "graph"]:
            # frontend can render input differently based on type
            problem_payload["options"] = None  # can be omitted if preferred

        return jsonify({
            "subtopic": next_question.subtopic,
            "problem": problem_payload
        })


# This route evaluates a student's answer using GPT and returns 'Correct' or 'Incorrect'
@assessment_bp.route('/skill_assessment/submit_solution', methods=['POST'])
def submit_solution():
    problem_id = request.json.get("problem_id")
    student_answer = request.json.get("answer")

    with Session(engine) as session:
        problem = session.get(DiagnosticProblem, problem_id)
        if not problem:
            return jsonify({"error": "Problem not found"}), 404

        question = problem.question
        correct_answer = problem.correct_answer
        qtype = problem.type

    try:
        # Select grading strategy
        if qtype == "mcq" or qtype == "numeric":
            prompt = f"""
You are an AI grader. Determine whether the student's answer is correct.
Question: {question}
Student's Answer: {student_answer}
Respond with only 'Correct' or 'Incorrect'.
"""
            judgment = ask_gpt(prompt, max_tokens=10)
            response = {"result": judgment.strip()}
            if judgment.strip().lower() == "incorrect" and correct_answer:
                response["correct_answer"] = correct_answer

        elif qtype == "proof":
            prompt = f"""
You are a math proof grader. Evaluate the student's proof and return only:
'Correct' or 'Incorrect' based on logical validity and completeness.

Question: {question}
Student's Proof: {student_answer}
"""
            judgment = ask_gpt(prompt, max_tokens=20)
            response = {"result": judgment.strip()}

        elif qtype == "graph":
            response = {
                "result": "Pending manual review",  # or "Needs graphical validation"
                "note": "Graph-based answers require visual review."
            }

        else:
            response = {"result": "Unsupported question type"}

        return jsonify(response)
    
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
            user = session.get(User, student_id)
            if not user or not isinstance(user, Student):
                return jsonify({"error": "User is not a student or not found."}), 400

            # Use it safely as a "Student"
            student = user
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


# Generate diagnostic questions for a given topic
@assessment_bp.route('/skill_assessment/diagnostic_test', methods=['POST'])
def diagnostic_test():
    topic = request.json.get('topic')
    grade = request.json.get('grade', 'K-12')
    teacher_id = request.json.get('teacher_id')
    student_id = request.json.get('student_id')
    config = teacher_configs.get(teacher_id, {})

    prompt = f"""
        You are a math expert. Generate diagnostic questions for topic \"{topic}\" at grade {grade} level.
        Each question must include:
        - difficulty ("easy", "medium", or "hard")
        - type (must be one of: "mcq", "numeric", "proof", "graph")
        - correct_answer
        - options (mandatory for MCQ; 3 to 5 well-formed choices; correct_answer must be one of them)

        Ensure at least one question of type "proof" and one of type "graph".
        Respond ONLY with strict JSON. DO NOT use code blocks (no ```), markdown, or explanations. 
        All MCQ questions must include:
        - A key "options" with 3–5 choices (as a list of strings)
        - The "correct_answer" must be one of the "options"

        Format:
        {{
        "Subtopic Name": [
            {{
            "difficulty": "...",
            "type": "...",
            "question": "...",
            "correct_answer": "...",
            "options": ["..."]
            }},
            ...
        ]
        }}
        
    """

    try:
        response = ask_gpt(prompt, max_tokens=2000)

        # Check if the response appears to be valid JSON
        if not response.strip().startswith("{"):
            print("GPT returned invalid JSON:\n", response)
            return jsonify({"error": "GPT did not return valid JSON", "raw": response}), 500

        # Attempt to parse JSON
        question_data = json.loads(response)

        with Session(engine) as session:
            for subtopic, questions in question_data.items():
                for item in questions:
                    qtype = item.get("type", "numeric")
                    # Enforce options check only for MCQ
                    if qtype == "mcq":
                        opts = item.get("options")
                        if len(opts) < 2:
                            print(f"Skipping invalid MCQ (missing or insufficient options): {item}")
                            continue
                        if item.get("correct_answer") not in opts:
                            print(f"Skipping MCQ (correct_answer not in options): {item}")
                            continue

                    db_entry = DiagnosticProblem(
                        student_id=int(student_id),
                        subtopic=subtopic,
                        question=item['question'],
                        difficulty=item.get('difficulty', 'medium'),
                        type=item.get('type', 'numeric'),
                        options=json.dumps(item.get('options')) if item.get('options') else None,
                        correct_answer=item.get('correct_answer'),
                        is_served=False
                    )
                    session.add(db_entry)
            session.commit()

        return jsonify({"status": "saved", "count": sum(len(v) for v in question_data.values())})

    except json.JSONDecodeError as je:
        print("JSON decoding failed:", str(je))
        return jsonify({
            "error": "Failed to parse GPT response as JSON",
            "details": str(je),
            "raw": response
        }), 500

    except Exception as e:
        print("Unhandled exception:", str(e))
        return jsonify({"error": str(e)}), 500


# list all the problems for testing
@assessment_bp.route('/skill_assessment/list_problems', methods=['GET'])
def list_problems():
    student_id = request.args.get('student_id')
    with Session(engine) as session:
        problems = session.query(DiagnosticProblem).filter_by(student_id=student_id).all()
        result = [{
            "id": p.id,
            "type": p.type,
            "difficulty": p.difficulty,
            "question": p.question,
            "options": json.loads(p.options) if p.options else None,
            "correct_answer": p.correct_answer
        } for p in problems]
    return jsonify(result)


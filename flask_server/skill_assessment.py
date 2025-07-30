from flask import request, jsonify, Blueprint
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import engine, Student, User_Login, User, DiagnosticProblem, Tutor, TeacherConfig
import random
import bcrypt
from openai import OpenAI
import os
import math
import json
from dotenv import load_dotenv
import re

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

def fisher_information(theta, b, a=1.0):
    p = irt_probability(theta, b, a)
    return a**2 * p * (1 - p)

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

def standard_error(theta, responses):
    info_sum = sum(fisher_information(theta, b) for b, _ in responses)
    return 1.0 / math.sqrt(info_sum) if info_sum > 0 else float('inf')


# Generate diagnostic questions for a given topic
@assessment_bp.route('/skill_assessment/diagnostic_test', methods=['POST'])
def diagnostic_test():
    topic = request.json.get('topic')
    grade = request.json.get('grade', 'K-12')
    teacher_id = request.json.get('teacher_id')
    student_id = request.json.get('student_id')
    # get teacher config
    with Session(engine) as session:
        teacher_config = session.query(TeacherConfig).filter_by(teacher_id=teacher_id).first()
        config = json.loads(teacher_config.config_json) if teacher_config else {}

    # Read the quantity set by the teacher, or use the default value of 10
    try:
        num_questions = int(config.get("num_questions", 10))
    except ValueError:
        return jsonify({"error": "'num_questions' must be an integer."}), 400
    if not (5 <= num_questions <= 30):
        return jsonify({"error": "'num_questions' must be between 5 and 30."}), 400

    prompt = f"""
        You are a math expert. Generate exactly {num_questions} diagnostic questions for topic \"{topic}\" at grade {grade} level.

        The questions must include a mix of all four types:
        - "mcq" (multiple choice)
        - "numeric" (short numeric answer)
        - "proof" (student writes a short logical justification)
        - "graph" (only include questions that require plotting or selecting coordinate points; DO NOT include questions that only require interpreting a graph)

        Distribute the types reasonably across the {num_questions}. Each question must be tagged with one of those types.

        Each question must be a JSON object and include:
        - "subtopic": a full skill path of topic → sub-topic → sub-sub-topic
        - "question": the question text
            - for proof: include one of the key words "why", "explain", "justify", "prove", "show that"
        - "type": one of "mcq", "numeric", "proof", or "graph"
        - "difficulty": "easy", "medium", or "hard"
        - "correct_answer":
            - for mcq/numeric: string or number. Only include minimal form answers; DO NOT return expressions like 5 * 2**0.5 — instead, return evaluated decimal numbers
            - for proof: text justification
            - for graph: a list of AT LEAST two (x, y) coordinate points as tuples or arrays (e.g., [[1,2], [2,4]])

        - "options": list of 3–5 choices (required for mcq only; correct_answer must be in options)

        Respond ONLY with strict JSON. DO NOT use code blocks (no ```), markdown, or explanations.
        Example format:
        {{
            "questions": [
                {{
                "subtopic": "Addition > Whole Numbers > Basic Addition",
                "question": "What is 2 + 2?",
                "type": "mcq",
                "difficulty": "easy",
                "correct_answer": "4",
                "options": ["3", "4", "5"]
                }}
            ]
        }}

        Validate the output JSON before responding. It must parse with Python's json.loads()
        """

    try:
        response = ask_gpt(prompt, max_tokens=2000)
        question_data = json.loads(response)
        questions = question_data.get("questions", [])

        if not isinstance(questions, list):
            return jsonify({"error": "'questions' must be a list"}), 400

        # Check if the response appears to be valid JSON
        if not response.strip().startswith("{"):
            print("GPT returned invalid JSON:\n", response)
            return jsonify({"error": "GPT did not return valid JSON", "raw": response}), 500

        with Session(engine) as session:
            for item in questions:
                subtopic = item.get("subtopic")
                if not subtopic or not item.get("question"):
                    continue  # skip incomplete data

                # Enforce options check only for MCQ
                if item.get("type") == "mcq":
                    opts = item.get("options")
                    if len(opts) < 2:
                        print(f"Skipping invalid MCQ (missing or insufficient options): {item}")
                        continue
                    if item.get("correct_answer") not in opts:
                        print(f"Skipping MCQ (correct_answer not in options): {item}")
                        continue

                # Auto-correct invalid "proof" types
                if item.get("type") == "proof":
                    qtext = item.get("question", "").lower()
                    allowed_proof_keywords = ["why", "explain", "justify", "prove", "show that"]
                    if not any(keyword in qtext for keyword in allowed_proof_keywords):
                        # Force to numeric if question is not truly 'proof' type
                        item["type"] = "numeric"
                        # Optional: extract numeric answer if embedded in explanation
                        ans_text = str(item.get("correct_answer", "")).strip()
                        match = re.search(r"[-+]?\d*\.?\d+", ans_text)
                        if match:
                            item["correct_answer"] = match.group(0)

                # Additional Backend Validation for Graph Questions
                if item.get("type") == "graph":
                    graph_answer = item.get("correct_answer")
                    if not (isinstance(graph_answer, list) and len(graph_answer) >= 2 and all(
                        isinstance(pt, (list, tuple)) and len(pt) == 2 for pt in graph_answer)):
                        print(f"Skipping invalid graph answer: {item}")
                        continue
                    item["correct_answer"] = [list(pt) for pt in item["correct_answer"]]

                db_entry = DiagnosticProblem(
                    student_id=int(student_id),
                    subtopic=subtopic,
                    question=item['question'],
                    difficulty=item.get('difficulty', 'medium'),
                    type=item.get('type', 'numeric'),
                    options=json.dumps(item.get('options')) if item.get('options') else None,
                    correct_answer=json.dumps(item.get("correct_answer")),
                    is_served=False
                )
                session.add(db_entry)
                session.flush() #  Ensure that the value of db_entry.id is assigned by the database
                item["id"] = db_entry.id  # Add the id generated by the database to the question
            session.commit()

        return jsonify({"status": "saved",
                        "count": sum(len(v) for v in question_data.values()),
                        "questions": questions})

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


# This route selects a random question from the diagnostic set
@assessment_bp.route('/skill_assessment/pick_problem', methods=['POST'])
def pick_problem():
    student_id = request.json.get('student_id')

    with Session(engine) as session:
        problems = session.query(DiagnosticProblem).filter_by(student_id=student_id, is_served=False).all()
        if not problems:
            return jsonify({"status": "completed"}), 200

        # Retrieve student's theta and responses from a hidden question
        progress = session.get(Student, student_id).progress_percentage
        try:
            state = json.loads(progress) if progress else {}
        except:
            state = {}

        theta = state.get("theta", 0.0)
        responses = state.get("responses", [])

        # Select problem with max Fisher information
        best = max(problems, key=lambda p: fisher_information(theta, difficulty_to_b(p.difficulty)))
        best.is_served = True
        session.commit()

        payload = {
            "question": best.question,
            "type": best.type,
            "difficulty": best.difficulty,
            "id": best.id,
            "correct_answer": best.correct_answer
        }
        if best.type == "mcq":
            payload["options"] = json.loads(best.options) if best.options else None
        return jsonify({"subtopic": best.subtopic, "problem": payload})


# This route evaluates a student's answer using GPT and returns 'Correct' or 'Incorrect'
@assessment_bp.route('/skill_assessment/submit_answer', methods=['POST'])
def submit_answer():
    problem_id = request.json.get("problem_id")
    student_id = request.json.get("student_id")
    student_answer = request.json.get("answer")

    with Session(engine) as session:
        problem = session.get(DiagnosticProblem, problem_id)
        student = session.get(Student, student_id)
        if not problem or not student:
            return jsonify({"error": "Problem or student not found"}), 404

        correct = 0
        qtype = problem.type

        if qtype == "mcq" or qtype == "numeric":
            correct_answer = json.loads(problem.correct_answer)
            correct = int(str(student_answer).strip() == str(correct_answer).strip())
        elif qtype == "proof":
            prompt = f"""
You are a math proof grader. Evaluate the student's proof and return only:
'Correct' or 'Incorrect'.
Question: {problem.question}
Student's Proof: {student_answer}
"""
            result = ask_gpt(prompt, max_tokens=10)
            correct = int("correct" in result.lower())
        elif qtype == "graph":
            return jsonify({"result": "Pending review"})

        try:
            # Update CAT state
            progress = student.progress_percentage
            state = json.loads(progress) if progress else {}
            theta = state.get("theta", 0.0)
            responses = state.get("responses", [])
            b = difficulty_to_b(problem.difficulty)
            new_theta = update_theta(theta, correct, b)
            responses.append((b, correct))
            se = standard_error(new_theta, responses)

            state = {"theta": new_theta, "responses": responses}
            student.progress_percentage = json.dumps(state)
            session.commit()

            # Termination condition
            if se < 0.3 or len(responses) >= 20:
                return jsonify({"status": "terminated", "reason": "CAT termination reached."})
            return jsonify({"status": "continue"})
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

    if answers is None or not isinstance(answers, list):
        return jsonify({"error": "The request body is missing or has an incorrect format for the 'answers' list"}), 400
    if student_id is None:
        return jsonify({"error": "The request body is missing the 'student_id' field"}), 400

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


# Endpoint to receive teacher configuration (FR-20-7)
@assessment_bp.route('/skill_assessment/teacher_config', methods=['POST'])
def teacher_config():
    config = request.json
    teacher_id = config.get('teacher_id')

    if not teacher_id:
        return jsonify({"error": "missing teacher_id"}), 400

    try:
        with Session(engine) as session:
            # Check if this teacher exists
            teacher = session.get(Tutor, teacher_id)
            if not teacher:
                return jsonify({"error": "teacher_id not exist or User type isn't Tutor"}), 404

            # Check if there is already a configuration
            existing_config = session.query(TeacherConfig).filter_by(teacher_id=teacher_id).first()
            if existing_config:
                existing_config.config_json = json.dumps(config)
            else:
                new_config = TeacherConfig(teacher_id=teacher_id, config_json=json.dumps(config))
                session.add(new_config)

            session.commit()
            return jsonify({"status": "saved", "config": config})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# skip the assessment (FR20-13)
@assessment_bp.route('/skill_assessment/skip_assessment', methods=['POST'])
def skip_assessment():
    student_id = request.json.get("student_id")
    if not student_id:
        return jsonify({"error": "student_id is required"}), 400

    with Session(engine) as session:
        student = session.get(Student, student_id)
        if not student:
            return jsonify({"error": "Student not found"}), 404
        
        # Record the skipping status (you can add the "skip_assessment" field in the "Student" table)
        student.progress_percentage = json.dumps({"status": "skipped"})
        session.commit()

    return jsonify({
        "status": "skipped",
        "message": "Student chose to skip the assessment and can return later."
    })

# start or resume the assessment (FR20-13)
@assessment_bp.route('/skill_assessment/start_or_resume', methods=['POST'])
def start_or_resume():
    student_id = request.json.get("student_id")
    if not student_id:
        return jsonify({"error": "student_id is required"}), 400

    with Session(engine) as session:
        problems = session.query(DiagnosticProblem)\
            .filter_by(student_id=student_id).all()

        unserved = [p for p in problems if not p.is_served]

        if not problems:
            return jsonify({
                "status": "not_started",
                "message": "No assessment found. Please generate one."
            })
        elif unserved:
            return jsonify({
                "status": "in_progress",
                "message": "Assessment in progress. You can resume.",
                "remaining_questions": len(unserved)
            })
        else:
            return jsonify({
                "status": "completed",
                "message": "Assessment has already been completed or all questions served."
            })


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
            "subtopic" : p.subtopic,
            "question": p.question,
            "options": json.loads(p.options) if p.options else None,
            "correct_answer": p.correct_answer
        } for p in problems]
    return jsonify(result)

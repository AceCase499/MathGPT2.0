import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, render_template
from openai import OpenAI
from sqlalchemy.orm import Session
from database import engine, Problem_Sessions  # your SQLAlchemy model

load_dotenv()
client = OpenAI(api_key=os.environ["GPT_API"])

problem_bp = Blueprint('problem', __name__)

# TC8.1 & TC8.2 – start a problem session
@problem_bp.route('/mathgpt/problem/start', methods=['POST'])
def start_problem():
    # 1) REQUIRE student_id
    student_id = request.form.get('student_id')
    if not student_id:
        return jsonify(error="Missing student_id"), 400

    # 2) VALIDATE it’s an integer
    try:
        student_id = int(student_id)
    except ValueError:
        return jsonify(error="Invalid student_id"), 400

    # (Optional) check it actually exists in DB
    from database import Student
    with Session(engine) as chk:
        if not chk.get(Student, student_id):
            return jsonify(error=f"Student {student_id} not found"), 404

    mode = request.form.get('mode', 'topic')
    topic = request.form.get('topic')
    lecture_id = request.form.get('lecture_session_id')

    if mode == 'topic':
        if not topic:
            return jsonify(error="Missing topic"), 400
        prompt = (
            f"You are a math instructor. Create a challenging math problem on: {topic}.\n"
            "Please write math expressions inside dollar signs like this: $single line math expression$, $$multi-line math expression$$.\n"
            "### Problem\n\n### Solution\n\n### Hint\n"
        )
        source = 'topic'
    else:
        if not lecture_id:
            return jsonify(error="Missing lecture_session_id"), 400
        # load last lecture text from LectureChat...
        from database import LectureChat, Lectures
        with Session(engine) as session:
            lecture = session.get(Lectures, lecture_id)
            if not lecture:
                return jsonify(error="Lecture not found"), 404
            last = (
                session.query(LectureChat)
                .filter_by(lecture_id=lecture_id)
                .order_by(LectureChat.timestamp.desc())
                .first()
            )
            lecture_text = last.message if last else lecture.content
            prompt = (
                "You are a math instructor. Based on this lecture, generate one math problem.\n"
                "Don't regurgitate the lecture, only generate a problem based on it.\n"
                "Please write math expressions inside dollar signs like this: $single line math expression$, $$multi-line math expression$$.\n"
                "### Problem\n\n### Solution\n\n### Hint\n\n"
                f"[Lecture]\n{lecture_text}"
            )
        source = f"lecture:{lecture_id}"
        topic = lecture.topic

    # ask OpenAI
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role":"user","content":prompt}]
    )
    content = resp.choices[0].message.content

    # parse into question, solution, hint
    if "### Solution" not in content or "### Hint" not in content:
        return jsonify(error="Bad format from AI", raw=content), 500
    q, rest = content.split("### Solution",1)
    sol, hint = rest.split("### Hint",1)
    question = q.strip().replace("### Problem","").strip()
    solution = sol.strip()
    hint = hint.strip()

    # persist
    with Session(engine) as session:
        ps = Problem_Sessions(
            student_id=int(request.form.get('student_id',0)),
            title=topic,
            topic=topic,
            source=source,
            created_at=datetime.now(timezone.utc),
            solution=solution,
            hint=hint,
            user_answer=None,
            is_done=False
        )
        session.add(ps)
        session.flush()           # assigns ps.id
        session.commit()
        session_id = ps.id

    return jsonify(session_id=session_id, question=question)


# TC8.3 – get hint
@problem_bp.route('/mathgpt/problem/hint', methods=['POST'])
def get_hint():
    sid = request.form.get('session_id')
    with Session(engine) as session:
        ps = session.get(Problem_Sessions, sid)
        if not ps: return jsonify(error="Not found"),404
        return jsonify(hint=ps.hint)


# TC8.4 – get solution
@problem_bp.route('/mathgpt/problem/solution', methods=['POST'])
def get_solution():
    sid = request.form.get('session_id')
    with Session(engine) as session:
        ps = session.get(Problem_Sessions, sid)
        if not ps: return jsonify(error="Not found"),404
        return jsonify(solution=ps.solution)


# TC8.5 – submit answer
@problem_bp.route('/mathgpt/problem/answer', methods=['POST'])
def submit_answer():
    data = request.form
    sid, ans = data.get('session_id'), data.get('answer')
    with Session(engine) as session:
        ps = session.get(Problem_Sessions, sid)
        if not ps: return jsonify(error="Not found"),404

        # ask OpenAI to judge
        judge = (
            "You will now judge whether the answer is correct or incorrect and give personalized feedback. Also you are replying to the student so address them as you or something.\n"
            f"Problem: {ps.solution}\n"
            "This was the original problem statement\n"
            f"User Answer: {ans}\n"
            "The above line is the answer the student gives\n"
            "Please compliment the student if they are correct\n"
            "Also don't assume they gave any solution if they didn't mention it\n"
            "Evaluate correctness and give brief feedback. Complement their methods or ask for their work if they gave none. Also try to suggest hints if they get wrong and not directly tell them.\n"
            "Please write math expressions inside dollar signs like this: $single line math expression$, $$multi-line math expression$$."
        )
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role":"user","content":judge}]
        )
        feedback = resp.choices[0].message.content

        # persist user answer
        ps.user_answer = ans
        session.commit()

    return jsonify(feedback=feedback)


# TC8.7 – complete session
@problem_bp.route('/mathgpt/problem/complete', methods=['POST'])
def complete():
    sid = request.form.get('session_id')
    with Session(engine) as session:
        ps = session.get(Problem_Sessions, sid)
        if not ps: return jsonify(error="Not found"),404
        ps.is_done = True
        session.commit()
    return jsonify(message="Session marked complete")


# TC8.8 – rename session
@problem_bp.route('/mathgpt/problem/rename', methods=['POST'])
def rename():
    sid, new = request.form.get('session_id'), request.form.get('new_title')
    with Session(engine) as session:
        ps = session.get(Problem_Sessions, sid)
        if not ps: return jsonify(error="Not found"),404
        ps.title = new
        session.commit()
    return jsonify(message="Title updated")


# TC8.9 – delete session
@problem_bp.route('/mathgpt/problem/delete', methods=['POST'])
def delete():
    sid = request.form.get('session_id')
    with Session(engine) as session:
        ps = session.get(Problem_Sessions, sid)
        if not ps: return jsonify(error="Not found"),404
        session.delete(ps)
        session.commit()
    return jsonify(message="Session deleted")

# TC9.0 – answer mode: get quick answer and steps
@problem_bp.route('/mathgpt/problem/answer_mode', methods=['POST'])
def answer_mode():
    question = request.form.get('question')
    student_id = request.form.get('student_id')
    if not question:
        return jsonify(error="Missing question"), 400

    try:
        student_id = int(student_id)
    except (ValueError, TypeError):
        return jsonify(error="Invalid or missing student_id"), 400

    # test if the student_id exist
    from database import Student
    with Session(engine) as chk:
        if not chk.get(Student, student_id):
            return jsonify(error=f"Student {student_id} not found"), 404

    # construct the Prompt
    prompt = (
        "You are a math tutor. Please answer the following question:\n\n"
        f"{question}\n\n"
        "First, give ONLY the final answer wrapped inside [Answer]...[/Answer].\n"
        "Then, give a detailed step-by-step explanation.\n"
        "Use $...$ for inline math, $$...$$ for block math."
    )

    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    content = resp.choices[0].message.content

    if "[Answer]" not in content or "[/Answer]" not in content:
        return jsonify(error="Bad format from AI", raw=content), 500

    final_answer = content.split("[Answer]", 1)[1].split("[/Answer]", 1)[0].strip()
    explanation = content.split("[/Answer]", 1)[1].strip()

    # store into Problem_Sessions
    with Session(engine) as session:
        ps = Problem_Sessions(
            student_id=student_id,
            title=question[:60],  # truncate if too long
            topic="Answer Mode",
            source="answer_mode",
            created_at=datetime.now(timezone.utc),
            solution=explanation,
            hint=final_answer,
            user_answer=None,
            is_done=False
        )
        session.add(ps)
        session.flush()
        session_id = ps.id
        session.commit()

    return jsonify(
        session_id=session_id,
        question=question,
        final_answer=final_answer,
        steps=explanation
    )


# list all problem sessions
@problem_bp.route('/mathgpt/problem/list', methods=['GET'])
def list_problems():
    with Session(engine) as session:
        all_ps = session.query(Problem_Sessions).all()
        result = [{
            "session_id": ps.id,
            "title": ps.title,
            "topic": ps.topic,
            "source": ps.source,
            "created_at": ps.created_at,
            "is_done": ps.is_done
        } for ps in all_ps]
    return jsonify(result)


@problem_bp.route('/problem_page')
def frontend():
    return render_template('problem.html')

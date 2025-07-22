from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from datetime import datetime, timezone
import uuid
from flask import Blueprint
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from database import Lectures, LectureChat, Student

load_dotenv()

client = OpenAI(api_key=os.environ.get("GPT_API"))
database_url = os.environ.get("DATABASE_URL")
engine = create_engine(database_url)

# Create a Flask application object
lecture_bp = Blueprint('lecture', __name__)

# Create a endpoint
@lecture_bp.route('/mathgpt', methods=['GET', 'POST'])
def start_lecture():
    topic      = request.form.get('topic')
    student_id = request.form.get('student_id')
    if not topic or not student_id:
        return jsonify({'error':'Missing topic or student_id'}), 400

    with Session(engine) as session:
        student = session.get(Student, int(student_id))
        if not student:
            return jsonify({'error':f'Student {student_id} not found'}), 404
        bio = student.bio or "No bio provided."

    # build a system prompt with the student’s bio
    system_msg = {
        "role": "system",
        "content": (
            f"This is a one-on-one math lecture for a student whose bio is:\n\n"
            f"{bio}\n\n"
            "Use that to personalize tone, pacing, and examples."
        )
    }

    user_prompt = (
        f"Give a multi-paragraph lecture on: {topic}. "
        "Be math-focused, use real-world examples, a fun fact, "
        "and write math inside $…$ or $$…$$."
    )

    messages = [
        system_msg,
        {"role":"user","content":user_prompt}
    ]

    # call OpenAI
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    content = response.choices[0].message.content

    # store in DB
    with Session(engine) as session:
        new_lecture = Lectures(
            student_id=int(student_id),
            title="Untitled Chat Lecture",
            topic=topic, subtopic="Chat Session", content=""
        )
        session.add(new_lecture)
        session.commit()

        # save the system message, the user prompt, and the AI reply
        session.add_all([
            LectureChat(
                lecture_id=new_lecture.id,
                sender="system",
                message=bio,
                timestamp=datetime.now(timezone.utc)
            ),
            LectureChat(
                lecture_id=new_lecture.id,
                sender="student",
                message=user_prompt,
                timestamp=datetime.now(timezone.utc)
            ),
            LectureChat(
                lecture_id=new_lecture.id,
                sender="ai",
                message=content,
                timestamp=datetime.now(timezone.utc)
            )
        ])
        session.commit()
        lecture_id = new_lecture.id

    return jsonify({"lecture_id": lecture_id, "lecture": content})


@lecture_bp.route('/mathgpt/followup', methods=['GET','POST'])
def followup():
    lecture_id = request.form.get('lecture_id')
    question   = request.form.get('question')
    if not lecture_id or not question:
        return jsonify({'error':'Missing lecture_id or question'}), 400

    with Session(engine) as session:
        # grab student bio (via the lecture)
        lec = session.get(Lectures, int(lecture_id))
        student = session.get(Student, lec.student_id)
        bio = student.bio or "No bio provided."

        # rehydrate the entire chat
        prev = session.query(LectureChat) \
                      .filter_by(lecture_id=lecture_id) \
                      .order_by(LectureChat.timestamp).all()

    # build messages: system → all history → new user question
    messages = [
        {"role":"system", "content":(
            f"Student bio:\n{bio}\nUse it to personalize pacing & tone."
        )}
    ]
    for msg in prev:
        role = msg.sender if msg.sender in ("student","ai") else "assistant"
        messages.append({"role":role, "content":msg.message})

    # add the new question
    messages.append({
        "role":"user",
        "content": question + 
            "\nPlease write math inside $…$ or $$…$$."
    })

    # ask GPT
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    answer = response.choices[0].message.content

    # save question + answer
    with Session(engine) as session:
        session.add_all([
            LectureChat(
                lecture_id=lecture_id,
                sender="student",
                message=question,
                timestamp=datetime.now(timezone.utc)
            ),
            LectureChat(
                lecture_id=lecture_id,
                sender="ai",
                message=answer,
                timestamp=datetime.now(timezone.utc)
            )
        ])
        session.commit()

    return jsonify({"answer": answer})


# TC7.3: mark lecture as done
@lecture_bp.route('/mathgpt/complete', methods=['POST', 'GET'])
def complete():
    data = request.json
    session_id = data.get('session_id')
    session = lecture_store.get(session_id)
    if not session:
        return 'Session not found', 404
    session['is_done'] = True
    return jsonify({"message": "Lecture marked as complete"})


@lecture_bp.route('/mathgpt/session', methods=['GET', 'POST'])
def get_session():
    lecture_id = request.args.get('lecture_id')
    with Session(engine) as session:
        chats = session.query(LectureChat).filter_by(lecture_id=lecture_id).order_by(LectureChat.timestamp).all()
        messages = [{"sender": chat.sender, "message": chat.message, "timestamp": chat.timestamp} for chat in chats]
        return jsonify(messages)


@lecture_bp.route('/mathgpt/lectures', methods=['GET', 'POST'])
def list_lectures():
    student_id = request.args.get('student_id')
    with Session(engine) as session:
        lectures = session.query(Lectures).filter_by(student_id=student_id).all()
        result = [{
            "lecture_id": lec.id,
            "topic": lec.topic,
            "created_at": lec.chat_messages[0].timestamp.isoformat() if lec.chat_messages else None,
            "updated_at": lec.chat_messages[-1].timestamp.isoformat() if lec.chat_messages else None
        } for lec in lectures]
        return jsonify(result)


@lecture_bp.route('/mathgpt/rename', methods=['POST', 'GET'])
def rename():
    data = request.json
    lecture_id = data.get('lecture_id')
    new_title = data.get('new_title')

    with Session(engine) as session:
        lecture = session.get(Lectures, lecture_id)
        if not lecture:
            return jsonify({'error': 'Lecture not found'}), 404
        lecture.title = new_title
        session.commit()
        return jsonify({'message': 'Lecture renamed'})


@lecture_bp.route('/mathgpt/delete', methods=['POST', 'GET'])
def delete():
    data = request.json
    lecture_id = data.get('lecture_id')
    with Session(engine) as session:
        lecture = session.get(Lectures, lecture_id)
        if not lecture:
            return jsonify({'error': 'Lecture not found'}), 404
        session.delete(lecture)
        session.commit()
        return jsonify({'message': 'Lecture deleted'})

# show on the front end
@lecture_bp.route('/lectures_page')
def frontend():
    return render_template('lecture.html')
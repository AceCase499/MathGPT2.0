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

client = OpenAI(api_key=os.environ["GPT_API"])
database_url = os.environ.get("DATABASE_URL")
engine = create_engine(database_url)

# Create a Flask application object
lecture_bp = Blueprint('lecture', __name__)

# Create a endpoint
@lecture_bp.route('/mathgpt', methods=['GET', 'POST'])
def start_lecture():
    topic = request.form.get('topic')
    student_id = request.form.get('student_id')

    if not topic or not student_id:
        return jsonify({'error': 'Missing topic or student_id'}), 400

    prompt = f"Give a multi-paragraph lecture on: {topic}. Please make sure this is math related or respond with a short message encouraging the user to stay focused on math. Use real world examples, and provide a fun fact related to the topic. If you cannot provide a lecture on the topic, respond with a short message encouraging the user to stay focused on math."
    prompt += "Please write math expressions inside dollar signs like this: $single line math expression$, $$multi-line math expression$$."
    messages = [{"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    content = response.choices[0].message.content
    messages.append({"role": "assistant", "content": content})

    with Session(engine) as session:
        student = session.get(Student, int(student_id))
        if not student:
            return jsonify({"error": f"Student with id {student_id} not found"}), 404

        new_lecture = Lectures(
            student_id=int(student_id),
            title="Untitled Chat Lecture",
            topic=topic,
            subtopic="Chat Session",
            content=""
        )
        session.add(new_lecture)
        session.commit()

        for msg in messages:
            chat = LectureChat(
                lecture_id=new_lecture.id,
                sender="student" if msg["role"] == "user" else "ai",
                message=msg["content"],
                timestamp=datetime.now(timezone.utc)
            )
            session.add(chat)

        session.commit()
        lecture_id = new_lecture.id

    return jsonify({"lecture_id": lecture_id, "lecture": content})


@lecture_bp.route('/mathgpt/followup', methods=['GET', 'POST'])
def followup():
    lecture_id = request.form.get('lecture_id')
    question = request.form.get('question')

    if not lecture_id or not question:
        return jsonify({'error': 'Missing lecture_id or question'}), 400

    with Session(engine) as session:
        prev_messages = session.query(LectureChat).filter_by(lecture_id=lecture_id).order_by(LectureChat.timestamp).all()
        messages = []
        for msg in prev_messages:
            messages.append({"role": "user" if msg.sender == "student" else "assistant", "content": msg.message})

        messages.append({"role": "user", "content": question + "\nPlease write math expressions inside dollar signs like this: $single line math expression$, $$multi-line math expression$$."})

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        answer = response.choices[0].message.content

        chat_user = LectureChat(
            lecture_id=lecture_id,
            sender="student",
            message=question,
            timestamp=datetime.now(timezone.utc)
        )
        chat_ai = LectureChat(
            lecture_id=lecture_id,
            sender="ai",
            message=answer,
            timestamp=datetime.now(timezone.utc)
        )

        session.add_all([chat_user, chat_ai])
        session.commit()

    return jsonify({"answer": answer})


# TC7.3: mark lecture as done
@lecture_bp.route('/mathgpt/complete', methods=['POST'])
def complete():
    session_id = request.form.get('session_id')
    session = lecture_store.get(session_id)
    if not session:
        return 'Session not found', 404
    session['is_done'] = True
    return jsonify({"message": "Lecture marked as complete"})


@lecture_bp.route('/mathgpt/session', methods=['GET', 'POST'])
def get_session():
    lecture_id = request.form.get('lecture_id')
    with Session(engine) as session:
        chats = session.query(LectureChat).filter_by(lecture_id=lecture_id).order_by(LectureChat.timestamp).all()
        messages = [{"sender": chat.sender, "message": chat.message, "timestamp": chat.timestamp} for chat in chats]
        return jsonify(messages)


@lecture_bp.route('/mathgpt/lectures', methods=['GET', 'POST'])
def list_lectures():
    student_id = request.form.get('student_id')
    with Session(engine) as session:
        lectures = session.query(Lectures).filter_by(student_id=student_id).all()
        result = [{
            "lecture_id": lec.id,
            "topic": lec.topic,
            "subtopic": lec.subtopic,
            "title": lec.title,
            "created_at": lec.chat_messages[0].timestamp.isoformat() if lec.chat_messages else None,
            "updated_at": lec.chat_messages[-1].timestamp.isoformat() if lec.chat_messages else None
        } for lec in lectures]
        return jsonify(result)


@lecture_bp.route('/mathgpt/rename', methods=['POST'])
def rename():
    lecture_id = request.form.get('lecture_id')
    new_title = request.form.get('new_title')

    with Session(engine) as session:
        lecture = session.get(Lectures, lecture_id)
        if not lecture:
            return jsonify({'error': 'Lecture not found'}), 404
        lecture.title = new_title
        session.commit()
        return jsonify({'message': 'Lecture renamed'})

@lecture_bp.route('/mathgpt/lecture_title', methods=['POST'])
def title():
    lecture_id = request.form.get('lecture_id')

    with Session(engine) as session:
        lecture = session.get(Lectures, lecture_id)
        if not lecture:
            return jsonify({'error': 'Lecture not found'}), 404
        return jsonify({'title': lecture.title})


@lecture_bp.route('/mathgpt/delete', methods=['POST'])
def delete():
    lecture_id = request.form.get('lecture_id')
    with Session(engine) as session:
        lecture = session.get(Lectures, lecture_id)
        if not lecture:
            return jsonify({'error': 'Lecture not found'}), 404
        for chat in lecture.chat_messages:
            session.delete(chat)
        session.delete(lecture)
        session.commit()
        return jsonify({'message': 'Lecture deleted'})

# show on the front end
@lecture_bp.route('/lectures_page')
def frontend():
    return render_template('lecture.html')
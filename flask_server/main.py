# This file creates the tables for the supabase database and adds basic user creation and user login functionality
# Actions are stored at "\create_user" and "\login"
# Data is requested as request.form.get('____') with ____ replacable by user data columns in the database
# "create_user()" takes in user data and adds a new us rto the database
# "login()" takes in a username and password and returns whether or not they are valid (also returns user_id if valid)

# For backend:
# Nullable means if you want to have a field that can be empty
# Primary key is a unique identifier for each row in the table
# Foreign key is a reference to another table's primary key
# Polymorphic identity is used for inheritance in SQLAlchemy, allowing you to query subclasses of a base class
# Relationship is used to define relationships between tables in SQLAlchemy
# Flask is used to create a web application with routes for user creation and login

from typing import Optional, List
from sqlalchemy import create_engine, String, Text, select, ForeignKey, Integer
from sqlalchemy.orm import DeclarativeBase, Session, mapped_column, Mapped, relationship
from flask import Flask, render_template, request, redirect, jsonify
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv
from lecture import lecture_bp
from problem import problem_bp
import os
from database import User, Student, Tutor, User_Login, Lectures, LectureChat

load_dotenv()

database_url = os.environ.get("DATABASE_URL")
engine = create_engine(database_url)
app = Flask(__name__)
app.register_blueprint(lecture_bp)
app.register_blueprint(problem_bp)
CORS(app)

# Homepage
@app.route('/')
def home():
    return render_template('home.html')

# Create User Code
@app.route('/create_user', methods=['GET', 'POST'])
def create_user():
    if request.method == 'POST':
        try:
            user_type = request.form.get('user_type', '').strip().lower()
            username = request.form.get('username')

            with Session(engine) as session:
                # Check for duplicate username
                if session.query(User_Login).filter_by(username=username).first():
                    return "Username already exists. Please choose a different username."

                # Choose correct subclass
                if user_type == 'student':
                    user = Student(
                        user_type="Student",
                        name=request.form.get('name'),
                        email = request.form.get('email'),
                        district=request.form.get('district'),
                        age=request.form.get('age'),
                        teacher_id=None,
                        tutor_id=None,
                        grade=1,
                        staring_assessment=None,
                        current_subject=None,
                        progress_percentage=None
                    )
                elif user_type == 'tutor':
                    user = Tutor(
                        user_type="Tutor",
                        email = request.form.get('email'),
                        name=request.form.get('name'),
                        district=request.form.get('district'),
                        age=request.form.get('age'),
                        subjects=request.form.get('subjects')
                    )
                else:
                    user = User(
                        user_type="User",
                        email = request.form.get('email'),
                        name=request.form.get('name'),
                        district=request.form.get('district'),
                        age=request.form.get('age')
                    )

                session.add(user)
                session.flush()  # assigns user.id

                login_info = User_Login(
                    id=user.id,
                    username=username,
                    password=request.form.get('password')
                )
                session.add(login_info)
                session.commit()

            return "User created successfully"
        except Exception as e:
            return f"Error: {str(e)}"
    return "User created"

# Code for user login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Store the input variables
        username = request.form.get('username')
        password = request.form.get('password')
        with Session(engine) as session:
            # Query the database for the user with the given username and password
            user_login = session.query(User_Login).filter_by(username=username, password=password).first()
            if user_login:
                # If the user exists, return a message (this will be changed to actually logging the user in)
                return jsonify(status = True, user_id = user_login.id)
            else:
                # If the user does not exist, return an error message
                return jsonify(status = False)
    # Sends user to login.html page
    return render_template('login.html')

@app.route('/lecture_chat', methods=['POST'])
def add_chat_message():
    data = request.form
    lecture_id = data.get('lecture_id')
    sender = data.get('sender')  # "student" or "ai"
    message = data.get('message')

    if not message or sender not in ['student', 'ai']:
        return "Invalid input", 400

    with Session(engine) as session:
        if not lecture_id:
            student_id = data.get('student_id')  # must be provided in the form
            if not student_id:
                return "Missing student_id to create lecture", 400

            new_lecture = Lectures(
                student_id=int(student_id),
                title="Untitled Chat Lecture",
                topic="General",
                subtopic="Chat Session",
                content=""
            )
            session.add(new_lecture)
            session.commit()
            lecture_id = new_lecture.id
        else:
            lecture_id = int(lecture_id)

        chat = LectureChat(
            lecture_id=lecture_id,
            sender=sender,
            message=message,
            timestamp=datetime.utcnow()
        )
        session.add(chat)
        session.commit()

    return f"Message stored in Lecture ID {lecture_id}"

@app.route('/lecture_chat/<int:lecture_id>')
def view_lecture_chat(lecture_id):
    with Session(engine) as session:
        messages = session.query(LectureChat).filter_by(lecture_id=lecture_id).order_by(LectureChat.timestamp).all()
        return render_template("chat_view.html", messages=messages)

@app.route('/lecture_chat_view', methods=['GET'])
def redirect_to_chat():
    lecture_id = request.args.get('lecture_id')
    return redirect(f'/lecture_chat/{lecture_id}')

@app.route('/chat_simulator')
def chat_simulator():
    return render_template('chat_simulator.html')

# Example code for chat_view.html
"""<h2>Lecture Chat</h2>
<ul>
  {% for msg in messages %}
    <li>
      <strong>{{ msg.sender|capitalize }}:</strong> {{ msg.message }} <em>({{ msg.timestamp }})</em>
    </li>
  {% endfor %}
</ul>
"""

if __name__ == '__main__':
    app.run(debug=True)

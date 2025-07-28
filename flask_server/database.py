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
from sqlalchemy import create_engine, String, Text, select, ForeignKey, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase, Session, mapped_column, Mapped, relationship
from flask import Flask, render_template, request, redirect
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv
import os
import datetime

load_dotenv()

database_url = os.environ.get("DATABASE_URL")
engine = create_engine(database_url)
app = Flask(__name__)
CORS(app)

# Base class for declarative models
class Base(DeclarativeBase):
    pass

# Default User class for basically everyone
class User(Base):
    __tablename__ = "user"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_type: Mapped[str]
    email: Mapped[str]
    district: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(String, nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationship to link User with User_Login
    __mapper_args__ = {
        "polymorphic_identity": "User",
        "polymorphic_on": "user_type",
    }

    def __repr__(self):
        return f"User(id={self.id}, name={self.username})"

# Side class that corresponds to User that includes login information
class User_Login(Base):
    __tablename__ = "user_login"
    id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)

# Tutor class
class Tutor(User):
    __tablename__ = "tutor"
    id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    subjects: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationship to link Tutor with Student
    students: Mapped[List["Student"]] = relationship(
        back_populates="tutor",
        foreign_keys="Student.tutor_id"
    )

    __mapper_args__ = {
        "polymorphic_identity": "Tutor",
    }

    def __repr__(self):
        return f"Tutor(id={self.id}, username={self.username})"

# Student class
class Student(User):
    __tablename__ = "student"
    id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    teacher_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tutor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tutor.id"), nullable=True)
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    staring_assessment: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    progress_percentage: Mapped[Optional[float]] = mapped_column(String, nullable=True)

    # Relationship to link Student with Tutor
    tutor: Mapped[Optional["Tutor"]] = relationship(
        back_populates="students",
        foreign_keys=[tutor_id]
    )

    lectures: Mapped[List["Lectures"]] = relationship(
        back_populates="students",
        foreign_keys="Lectures.student_id"
    )

    problem_sessions: Mapped[List["Problem_Sessions"]] = relationship(
        back_populates="students",
        foreign_keys="Problem_Sessions.student_id"
    )

    __mapper_args__ = {
        "polymorphic_identity": "Student",
    }

    course_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("courses.id"), nullable=True
    )

    # back to the Course
    course: Mapped[Optional["Course"]] = relationship(
        "Course",
        back_populates="students"
    )

    def __repr__(self):
        return f"Student(id={self.id}, username={self.username})"

class Lectures(Base):
    __tablename__ = "lectures"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("student.id"))
    title: Mapped[str] = mapped_column(String(50), default="Untitled Lecture")
    topic: Mapped[str] = mapped_column(String)
    subtopic: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)

    students: Mapped[List["Student"]] = relationship(
        back_populates="lectures",
        foreign_keys="Lectures.student_id"
    )

    students: Mapped["Student"] = relationship(back_populates="lectures")
    chat_messages: Mapped[List["LectureChat"]] = relationship(back_populates="lecture")

    def __repr__(self):
        return f"Lecture(id={self.id}, title={self.title})"

class LectureChat(Base):
    __tablename__ = "lecture_chat"
    id: Mapped[int] = mapped_column(primary_key=True)
    lecture_id: Mapped[int] = mapped_column(ForeignKey("lectures.id"))
    sender: Mapped[str] = mapped_column(String)  # "student" or "ai"
    message: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime)

    lecture: Mapped["Lectures"] = relationship(back_populates="chat_messages")

class Problem_Sessions(Base):
    __tablename__ = "problem_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("student.id"))
    title: Mapped[str] = mapped_column(String)
    topic: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    solution: Mapped[str] = mapped_column(Text)
    hint: Mapped[str] = mapped_column(Text)
    user_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_done: Mapped[bool] = mapped_column(default=False)

    students: Mapped[List["Student"]] = relationship(
        back_populates="problem_sessions",
        foreign_keys="Problem_Sessions.student_id"
    )

    def __repr__(self):
        return f"Problem_Session(id={self.id}, title={self.title})"

class DiagnosticProblem(Base):
    __tablename__ = "diagnostic_problem"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("student.id"))
    subtopic: Mapped[str] = mapped_column(String)
    question: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String)
    type: Mapped[str] = mapped_column(String)
    options: Mapped[Optional[str]] = mapped_column(Text, nullable=True) 
    correct_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True) 
    is_served: Mapped[bool] = mapped_column(default=False)

    def __repr__(self):
        return f"DiagnosticProblem(id={self.id}, subtopic={self.subtopic})"

class TeacherConfig(Base):
    __tablename__ = "teacher_config"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("tutor.id"), unique=True, nullable=False)
    config_json: Mapped[str] = mapped_column(Text, nullable=False)

    teacher: Mapped["Tutor"] = relationship(backref="config")

    def __repr__(self):
        return f"TeacherConfig(teacher_id={self.teacher_id})"

class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(50), default="Untitled Course")
    topic: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    due_date:   Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # back to the User who created this course
    teacher: Mapped["User"] = relationship(
        "User",
        back_populates="courses_taught",
        foreign_keys=[teacher_id]
    )

    # one-to-many → many students
    students: Mapped[List["Student"]] = relationship(
        "Student",
        back_populates="course"
    )

    def __repr__(self):
        return f"Course(id={self.id}, title={self.title})"

Base.metadata.create_all(engine)
engine.dispose()

# # Homepage
# @app.route('/')
# def home():
#     return render_template('home.html')

# # Create User Code
# @app.route('/create_user', methods=['GET', 'POST'])
# def create_user():
#     if request.method == 'POST':
#         try:
#             user_type = request.form.get('user_type', '').strip().lower()
#             username = request.form.get('username')

#             with Session(engine) as session:
#                 # Check for duplicate username
#                 if session.query(User_Login).filter_by(username=username).first():
#                     return "Username already exists. Please choose a different username."

#                 # Choose correct subclass
#                 if user_type == 'student':
#                     user = Student(
#                         user_type="Student",
#                         name=request.form.get('name'),
#                         email = request.form.get('email'),
#                         district=request.form.get('district'),
#                         age=request.form.get('age'),
#                         teacher_id=None,
#                         tutor_id=None,
#                         grade=1,
#                         staring_assessment=None,
#                         current_subject=None,
#                         progress_percentage=None
#                     )
#                 elif user_type == 'tutor':
#                     user = Tutor(
#                         user_type="Tutor",
#                         email = request.form.get('email'),
#                         name=request.form.get('name'),
#                         district=request.form.get('district'),
#                         age=request.form.get('age'),
#                         subjects=request.form.get('subjects')
#                     )
#                 else:
#                     user = User(
#                         user_type="User",
#                         email = request.form.get('email'),
#                         name=request.form.get('name'),
#                         district=request.form.get('district'),
#                         age=request.form.get('age')
#                     )

#                 session.add(user)
#                 session.flush()  # assigns user.id

#                 login_info = User_Login(
#                     id=user.id,
#                     username=username,
#                     password=request.form.get('password')
#                 )
#                 session.add(login_info)
#                 session.commit()

#             return "User created successfully"
#         except Exception as e:
#             return f"Error: {str(e)}"
#     return "User created"

# # Code for user login
# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if request.method == 'POST':
#         # Store the input variables
#         username = request.form.get('username')
#         password = request.form.get('password')
#         with Session(engine) as session:
#             # Query the database for the user with the given username and password
#             user_login = session.query(User_Login).filter_by(username=username, password=password).first()
#             if user_login:
#                 # If the user exists, return a message (this will be changed to actually logging the user in)
#                 return f"Login successful for user: {user_login.username} with ID: {user_login.id}"
#             else:
#                 # If the user does not exist, return an error message
#                 return "Invalid username or password"
#     # Sends user to login.html page
#     return render_template('login.html')

# @app.route('/lecture_chat', methods=['POST'])
# def add_chat_message():
#     data = request.form
#     lecture_id = data.get('lecture_id')
#     sender = data.get('sender')  # "student" or "ai"
#     message = data.get('message')

#     if not message or sender not in ['student', 'ai']:
#         return "Invalid input", 400

#     with Session(engine) as session:
#         if not lecture_id:
#             student_id = data.get('student_id')  # must be provided in the form
#             if not student_id:
#                 return "Missing student_id to create lecture", 400

#             new_lecture = Lectures(
#                 student_id=int(student_id),
#                 title="Untitled Chat Lecture",
#                 topic="General",
#                 subtopic="Chat Session",
#                 content=""
#             )
#             session.add(new_lecture)
#             session.commit()
#             lecture_id = new_lecture.id
#         else:
#             lecture_id = int(lecture_id)

#         chat = LectureChat(
#             lecture_id=lecture_id,
#             sender=sender,
#             message=message,
#             timestamp=datetime.utcnow()
#         )
#         session.add(chat)
#         session.commit()

#     return f"Message stored in Lecture ID {lecture_id}"

# @app.route('/lecture_chat/<int:lecture_id>')
# def view_lecture_chat(lecture_id):
#     with Session(engine) as session:
#         messages = session.query(LectureChat).filter_by(lecture_id=lecture_id).order_by(LectureChat.timestamp).all()
#         return render_template("chat_view.html", messages=messages)

# @app.route('/lecture_chat_view', methods=['GET'])
# def redirect_to_chat():
#     lecture_id = request.args.get('lecture_id')
#     return redirect(f'/lecture_chat/{lecture_id}')

# @app.route('/chat_simulator')
# def chat_simulator():
#     return render_template('chat_simulator.html')

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

# if __name__ == '__main__':
#     app.run(debug=True)

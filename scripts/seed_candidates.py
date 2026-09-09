#!/usr/bin/env python3
"""
Seed 10 demo candidates (individuals with skills/experience/education)
so Hire search + pagination can be exercised. Idempotent: skips emails
that already exist.

Run from repo root with the backend venv:
    .\\backend\\.venv\\Scripts\\python.exe scripts\\seed_candidates.py
"""

import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from werkzeug.security import generate_password_hash

from backend.extensions import db
from backend.models import User, Skill, Experience, Education

PASSWORD_HASH = generate_password_hash("Seed12345!")

CANDIDATES = [
    {
        "name": "Ahmed Raza", "email": "ahmed.raza.seed@example.com",
        "current_position": "Senior Python Backend Developer", "current_company": "TechCorp",
        "location": "Karachi, Pakistan", "employment_status": "unemployed",
        "skills": ["Python", "Django", "Flask", "PostgreSQL", "Docker", "Redis"],
        "experiences": [
            {"title": "Senior Backend Developer", "company": "TechCorp",
             "description": "Built REST APIs with Python Django and Flask, PostgreSQL optimization, Docker deployments.",
             "start_date": date(2021, 3, 1), "end_date": None},
            {"title": "Junior Python Developer", "company": "SoftWorks",
             "description": "Flask microservices, SQL queries, bug fixes.",
             "start_date": date(2019, 6, 1), "end_date": date(2021, 2, 28)},
        ],
        "educations": [{"degree": "Bachelor of Science in Computer Science", "school": "NED University", "field": "Computer Science"}],
    },
    {
        "name": "Fatima Khan", "email": "fatima.khan.seed@example.com",
        "current_position": "Machine Learning Engineer", "current_company": "DataLabs",
        "location": "Lahore, Pakistan", "employment_status": "unemployed",
        "skills": ["Python", "PyTorch", "TensorFlow", "scikit-learn", "SQL"],
        "experiences": [
            {"title": "Machine Learning Engineer", "company": "DataLabs",
             "description": "PyTorch models in production, Python data pipelines, TensorFlow training jobs.",
             "start_date": date(2022, 1, 15), "end_date": None},
        ],
        "educations": [{"degree": "Master of Science in Data Science", "school": "LUMS", "field": "Data Science"}],
    },
    {
        "name": "Bilal Hussain", "email": "bilal.hussain.seed@example.com",
        "current_position": "Data Analyst", "current_company": "InsightCo",
        "location": "Islamabad, Pakistan", "employment_status": "unemployed",
        "skills": ["Python", "SQL", "Pandas", "Excel", "PowerBI"],
        "experiences": [
            {"title": "Data Analyst", "company": "InsightCo",
             "description": "Python Pandas reporting, SQL dashboards, PowerBI analytics.",
             "start_date": date(2023, 4, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Business Administration", "school": "IBA Karachi", "field": "Business Analytics"}],
    },
    {
        "name": "Ayesha Malik", "email": "ayesha.malik.seed@example.com",
        "current_position": "Junior Python Developer", "current_company": "StartHub",
        "location": "Karachi, Pakistan", "employment_status": "unemployed",
        "skills": ["Python", "Flask", "JavaScript", "Git"],
        "experiences": [
            {"title": "Junior Python Developer", "company": "StartHub",
             "description": "Flask endpoints, JavaScript frontend fixes, Git workflows.",
             "start_date": date(2024, 8, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Science in Software Engineering", "school": "FAST NUCES", "field": "Software Engineering"}],
    },
    {
        "name": "Usman Tariq", "email": "usman.tariq.seed@example.com",
        "current_position": "Fullstack Developer", "current_company": "WebNest",
        "location": "Lahore, Pakistan", "employment_status": "working",
        "skills": ["Python", "React", "JavaScript", "Node.js", "MongoDB"],
        "experiences": [
            {"title": "Fullstack Developer", "company": "WebNest",
             "description": "React frontends with Python Flask backends, Node.js services, MongoDB.",
             "start_date": date(2020, 9, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Science in Computer Science", "school": "PUCIT", "field": "Computer Science"}],
    },
    {
        "name": "Sana Iqbal", "email": "sana.iqbal.seed@example.com",
        "current_position": "Java Backend Developer", "current_company": "FinServe",
        "location": "Karachi, Pakistan", "employment_status": "unemployed",
        "skills": ["Java", "Spring Boot", "MySQL", "Kafka"],
        "experiences": [
            {"title": "Java Backend Developer", "company": "FinServe",
             "description": "Spring Boot services, MySQL schema design, Kafka event streaming.",
             "start_date": date(2020, 2, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Science in Computer Science", "school": "SZABIST", "field": "Computer Science"}],
    },
    {
        "name": "Hamza Sheikh", "email": "hamza.sheikh.seed@example.com",
        "current_position": "Frontend Developer", "current_company": "PixelWorks",
        "location": "Remote", "employment_status": "working",
        "skills": ["JavaScript", "React", "TypeScript", "CSS"],
        "experiences": [
            {"title": "Frontend Developer", "company": "PixelWorks",
             "description": "React TypeScript applications, CSS design systems.",
             "start_date": date(2022, 7, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Science in Information Technology", "school": "Virtual University", "field": "Information Technology"}],
    },
    {
        "name": "Maryam Aslam", "email": "maryam.aslam.seed@example.com",
        "current_position": "Senior Java Developer", "current_company": "BankTech",
        "location": "Karachi, Pakistan", "employment_status": "unemployed",
        "skills": ["Java", "SQL", "Oracle", "Hibernate"],
        "experiences": [
            {"title": "Senior Java Developer", "company": "BankTech",
             "description": "Enterprise Java with Hibernate, Oracle SQL performance tuning.",
             "start_date": date(2018, 5, 1), "end_date": None},
        ],
        "educations": [{"degree": "Master of Science in Computer Science", "school": "IBA Karachi", "field": "Computer Science"}],
    },
    {
        "name": "Ali Haider", "email": "ali.haider.seed@example.com",
        "current_position": "DevOps Engineer", "current_company": "CloudNine",
        "location": "Islamabad, Pakistan", "employment_status": "working",
        "skills": ["Docker", "Kubernetes", "AWS", "Python", "Bash"],
        "experiences": [
            {"title": "DevOps Engineer", "company": "CloudNine",
             "description": "Kubernetes on AWS, Docker pipelines, Python automation scripts with Bash.",
             "start_date": date(2021, 11, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Science in Computer Engineering", "school": "NUST", "field": "Computer Engineering"}],
    },
    {
        "name": "Hira Shahid", "email": "hira.shahid.seed@example.com",
        "current_position": "QA Automation Engineer", "current_company": "TestPro",
        "location": "Lahore, Pakistan", "employment_status": "working",
        "skills": ["Python", "Selenium", "SQL", "JMeter"],
        "experiences": [
            {"title": "QA Automation Engineer", "company": "TestPro",
             "description": "Selenium test automation in Python, SQL test data setup, JMeter load tests.",
             "start_date": date(2023, 10, 1), "end_date": None},
        ],
        "educations": [{"degree": "Bachelor of Science in Software Engineering", "school": "COMSATS", "field": "Software Engineering"}],
    },
]


def seed():
    created = 0
    skipped = 0
    for c in CANDIDATES:
        if User.query.filter_by(email=c["email"]).first():
            skipped += 1
            continue
        user = User(
            email=c["email"],
            name=c["name"],
            password_hash=PASSWORD_HASH,
            role="individual",
            plan="trial",
            current_position=c["current_position"],
            current_company=c["current_company"],
            location=c["location"],
            employment_status=c["employment_status"],
        )
        db.session.add(user)
        db.session.flush()  # get user.id
        for s in c["skills"]:
            db.session.add(Skill(user_id=user.id, name=s))
        for e in c["experiences"]:
            db.session.add(Experience(
                user_id=user.id, title=e["title"], company=e["company"],
                description=e["description"], start_date=e["start_date"],
                end_date=e["end_date"],
            ))
        for edu in c["educations"]:
            db.session.add(Education(
                user_id=user.id, degree=edu["degree"],
                school=edu["school"], field=edu["field"],
            ))
        created += 1
    db.session.commit()
    print(f"Seeded {created} candidates, skipped {skipped} existing.")


if __name__ == "__main__":
    from backend.app import create_app

    app = create_app()
    with app.app_context():
        try:
            seed()
        except Exception:
            db.session.rollback()
            raise

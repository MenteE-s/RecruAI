#!/usr/bin/env python3
"""
One-time script to backfill profile embeddings for existing users.
Generates embeddings from existing profile data (skills, experiences, etc.)
and stores them in the recommendation_profile_embeddings table.
Run: docker compose exec backend python scripts/backfill_profile_embeddings.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.extensions import db
from backend.models import (
    User, Skill, Experience, Education, Project,
    ProfileSection, Certification, Publication, Award, Language,
    VolunteerExperience, CourseTraining, KeyAchievement,
    ProfessionalMembership, Patent
)
from backend.recommendations.tools.supervisor import RecommendationSupervisor
from sqlalchemy.orm import sessionmaker


def assemble_profile_data(user):
    name = user.name or ""
    name_parts = name.split(" ", 1)
    first_name = name_parts[0] if name_parts else user.name or ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    about = ""
    summary = ""
    for sec in ProfileSection.query.filter_by(user_id=user.id).all():
        sec_data = sec.to_dict()
        st = sec_data.get('section_type', '')
        sd = sec_data.get('section_data', {})
        if st == 'about':
            about = sd.get('about', sd.get('content', '')) if isinstance(sd, dict) else str(sd)
        elif st == 'summary':
            summary = sd.get('summary', sd.get('content', '')) if isinstance(sd, dict) else str(sd)

    return {
        'first_name': first_name,
        'last_name': last_name,
        'about': about,
        'summary': summary,
        'skills': [skill.to_dict() for skill in Skill.query.filter_by(user_id=user.id).all()],
        'experiences': [exp.to_dict() for exp in Experience.query.filter_by(user_id=user.id).all()],
        'educations': [edu.to_dict() for edu in Education.query.filter_by(user_id=user.id).all()],
        'projects': [proj.to_dict() for proj in Project.query.filter_by(user_id=user.id).all()],
        'certifications': [c.to_dict() for c in Certification.query.filter_by(user_id=user.id).all()],
        'publications': [p.to_dict() for p in Publication.query.filter_by(user_id=user.id).all()],
        'awards': [a.to_dict() for a in Award.query.filter_by(user_id=user.id).all()],
        'languages': [l.to_dict() for l in Language.query.filter_by(user_id=user.id).all()],
        'volunteer_experiences': [v.to_dict() for v in VolunteerExperience.query.filter_by(user_id=user.id).all()],
        'course_trainings': [c.to_dict() for c in CourseTraining.query.filter_by(user_id=user.id).all()],
        'key_achievements': [k.to_dict() for k in KeyAchievement.query.filter_by(user_id=user.id).all()],
        'professional_memberships': [m.to_dict() for m in ProfessionalMembership.query.filter_by(user_id=user.id).all()],
        'patents': [p.to_dict() for p in Patent.query.filter_by(user_id=user.id).all()],
    }


def has_profile_data(user):
    checks = [
        Skill.query.filter_by(user_id=user.id).count(),
        Experience.query.filter_by(user_id=user.id).count(),
        Education.query.filter_by(user_id=user.id).count(),
        Project.query.filter_by(user_id=user.id).count(),
        Certification.query.filter_by(user_id=user.id).count(),
        Publication.query.filter_by(user_id=user.id).count(),
        Award.query.filter_by(user_id=user.id).count(),
        Language.query.filter_by(user_id=user.id).count(),
        VolunteerExperience.query.filter_by(user_id=user.id).count(),
        CourseTraining.query.filter_by(user_id=user.id).count(),
        KeyAchievement.query.filter_by(user_id=user.id).count(),
        ProfessionalMembership.query.filter_by(user_id=user.id).count(),
        Patent.query.filter_by(user_id=user.id).count(),
        ProfileSection.query.filter_by(user_id=user.id).count(),
    ]
    return sum(checks) > 0


def backfill_embeddings():
    supervisor = RecommendationSupervisor()
    supervisor.db_engine = db.engine
    supervisor._session_factory = sessionmaker(bind=db.engine)
    supervisor.retriever.db_engine = db.engine
    supervisor.retriever._session_factory = sessionmaker(bind=db.engine)

    users = User.query.all()
    total = len(users)
    success = 0
    skipped = 0

    print(f"Found {total} users. Processing...")

    for user in users:
        has_data = has_profile_data(user)

        if not has_data:
            print(f"  SKIP user {user.id} ({user.email}) — no profile data")
            skipped += 1
            continue

        profile_data = assemble_profile_data(user)
        result = supervisor.embed_and_store_profile(
            str(user.id),
            profile_data,
            str(user.organization_id) if user.organization_id else None
        )

        if result:
            skill_count = len(profile_data['skills'])
            exp_count = len(profile_data['experiences'])
            edu_count = len(profile_data['educations'])
            cert_count = len(profile_data['certifications'])
            pub_count = len(profile_data['publications'])
            print(f"  OK user {user.id} ({user.email}) — embedded ({skill_count} skills, {exp_count} exp, {edu_count} edu, {cert_count} certs, {pub_count} pubs)")
            success += 1
        else:
            print(f"  FAIL user {user.id} ({user.email}) — embedding failed")
            skipped += 1

    print(f"\nDone. {success} embedded, {skipped} skipped/failed out of {total} total users.")


if __name__ == '__main__':
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        backfill_embeddings()

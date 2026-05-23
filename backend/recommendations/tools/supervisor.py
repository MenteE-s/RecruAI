"""
Recommendation Supervisor
Orchestrates the recommendation pipeline
"""

import hashlib
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

from .embedder import RecommendationEmbedder
from .retriever import RecommendationRetriever
from .generator import RecommendationGenerator
from ...models import ProfileEmbedding, JobEmbedding, AgentEmbedding
from ...utils.cache import cache_get, cache_set


logger = logging.getLogger(__name__)


class RecommendationSupervisor:
    """
    Main orchestrator for the recommendation system.
    Handles embedding generation, storage, and retrieval for recommendations.
    """

    def __init__(self, db_engine: Optional[Engine] = None):
        self.db_engine = db_engine
        self._session_factory = sessionmaker(bind=db_engine) if db_engine else None

        self.embedder = RecommendationEmbedder()
        self.retriever = RecommendationRetriever(db_engine)
        self.generator = RecommendationGenerator()

    def _get_session(self):
        """Get database session"""
        if not self._session_factory:
            raise ValueError("Database engine not provided")
        return self._session_factory()

    def recommend_candidates_for_job(
        self,
        job_id: str,
        organization_id: Optional[str] = None,
        top_k: Optional[int] = None,
        include_explanations: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Recommend candidates for a job posting
        """
        session = self._get_session()
        try:
            # Get job embedding
            job_embedding = session.query(JobEmbedding).filter_by(job_id=job_id).first()
            if not job_embedding:
                # Job not embedded yet, need to embed it first
                raise ValueError(f"Job {job_id} not found in embeddings. Please embed the job first.")

            # Get job data for explanations
            job_data = {
                'job_content': job_embedding.job_content,
                'job_title': job_embedding.job_title,
                'industry': job_embedding.industry,
            }

            # Find similar profiles
            similar_profiles = self.retriever.find_similar_profiles(
                query_embedding=job_embedding.embedding,
                organization_id=organization_id,
                top_k=top_k
            )

            # Generate explanations if requested
            if include_explanations:
                for profile in similar_profiles:
                    profile_data = {
                        'profile_content': profile['profile_content'],
                    }
                    explanation = self.generator.generate_profile_explanation_sync(
                        profile_data, job_data, profile['similarity']
                    )
                    profile['explanation'] = explanation

            return similar_profiles

        finally:
            session.close()

    def recommend_jobs_for_profile(
        self,
        user_id: str,
        organization_id: Optional[str] = None,
        top_k: Optional[int] = None,
        include_explanations: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Recommend jobs for a user profile
        """
        session = self._get_session()
        try:
            # Get profile embedding
            profile_embedding = session.query(ProfileEmbedding).filter_by(user_id=user_id).first()
            if not profile_embedding:
                raise ValueError(f"Profile {user_id} not found in embeddings. Please embed the profile first.")

            # Get profile data for explanations
            profile_data = {
                'profile_content': profile_embedding.profile_content,
            }

            # Find similar jobs
            similar_jobs = self.retriever.find_similar_jobs(
                query_embedding=profile_embedding.embedding,
                organization_id=organization_id,
                top_k=top_k
            )

            # Generate explanations if requested
            if include_explanations:
                for job in similar_jobs:
                    job_data = {
                        'job_content': f"Job Title: {job['job_title']}\nIndustry: {job['industry']}",
                    }
                    explanation = self.generator.generate_job_explanation_sync(
                        job_data, profile_data, job['similarity']
                    )
                    job['explanation'] = explanation

            return similar_jobs

        finally:
            session.close()

    def recommend_agents_for_job(
        self,
        job_id: str,
        organization_id: Optional[str] = None,
        top_k: Optional[int] = None,
        include_explanations: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Recommend AI agents for interviewing candidates for a job
        """
        session = self._get_session()
        try:
            # Get job embedding
            job_embedding = session.query(JobEmbedding).filter_by(job_id=job_id).first()
            if not job_embedding:
                raise ValueError(f"Job {job_id} not found in embeddings. Please embed the job first.")

            # Get job data for explanations
            job_data = {
                'job_content': job_embedding.job_content,
                'job_title': job_embedding.job_title,
                'industry': job_embedding.industry,
            }

            # Find similar agents
            similar_agents = self.retriever.find_similar_agents(
                query_embedding=job_embedding.embedding,
                organization_id=organization_id,
                top_k=top_k
            )

            # Generate explanations if requested
            if include_explanations:
                for agent in similar_agents:
                    agent_data = {
                        'agent_name': agent['agent_name'],
                        'industry': agent['industry'],
                        'agent_content': '',  # We don't store full content in results for brevity
                    }
                    explanation = self.generator.generate_agent_explanation_sync(
                        agent_data, job_data, agent['similarity']
                    )
                    agent['explanation'] = explanation

            return similar_agents

        finally:
            session.close()

    def embed_and_store_profile(
        self,
        user_id: str,
        profile_data: Dict[str, Any],
        organization_id: Optional[str] = None
    ) -> bool:
        """
        Embed a user profile and store it in the database
        """
        session = self._get_session()
        try:
            # Create embedding text
            profile_text = self.embedder.embed_profile(profile_data)

            # Generate embedding
            embedding = self.embedder.embed_text(profile_text)

            # Check if profile already exists
            existing = session.query(ProfileEmbedding).filter_by(user_id=user_id).first()
            if existing:
                # Update existing
                existing.profile_content = profile_text
                existing.embedding = embedding
                existing.organization_id = organization_id
                existing.skills_count = len(profile_data.get('skills', []))
                existing.experience_years = self._calculate_experience_years(profile_data.get('experiences', []))
                existing.education_level = self._get_highest_education(profile_data.get('educations', []))
            else:
                # Create new
                profile_embedding = ProfileEmbedding(
                    user_id=user_id,
                    organization_id=organization_id,
                    profile_content=profile_text,
                    embedding=embedding,
                    skills_count=len(profile_data.get('skills', [])),
                    experience_years=self._calculate_experience_years(profile_data.get('experiences', [])),
                    education_level=self._get_highest_education(profile_data.get('educations', [])),
                )
                session.add(profile_embedding)

            session.commit()
            return True

        except Exception as e:
            session.rollback()
            logger.error(f"Failed to embed and store profile {user_id}: {e}")
            return False
        finally:
            session.close()

    def embed_and_store_job(
        self,
        job_id: str,
        job_data: Dict[str, Any],
        organization_id: Optional[str] = None
    ) -> bool:
        """
        Embed a job posting and store it in the database
        """
        session = self._get_session()
        try:
            # Create embedding text
            job_text = self.embedder.embed_job(job_data)

            # Generate embedding
            embedding = self.embedder.embed_text(job_text)

            # Check if job already exists
            existing = session.query(JobEmbedding).filter_by(job_id=job_id).first()
            if existing:
                # Update existing
                existing.job_content = job_text
                existing.embedding = embedding
                existing.organization_id = organization_id
                existing.job_title = job_data.get('title', '')
                existing.industry = job_data.get('industry', '')
                existing.experience_required = job_data.get('experience_required', 0)
                existing.skills_required = ','.join(job_data.get('skills', []))
            else:
                # Create new
                job_embedding = JobEmbedding(
                    job_id=job_id,
                    organization_id=organization_id,
                    job_content=job_text,
                    embedding=embedding,
                    job_title=job_data.get('title', ''),
                    industry=job_data.get('industry', ''),
                    experience_required=job_data.get('experience_required', 0),
                    skills_required=','.join(job_data.get('skills', [])),
                )
                session.add(job_embedding)

            session.commit()
            return True

        except Exception as e:
            session.rollback()
            logger.error(f"Failed to embed and store job {job_id}: {e}")
            return False
        finally:
            session.close()

    def embed_and_store_agent(
        self,
        agent_id: str,
        agent_data: Dict[str, Any],
        organization_id: Optional[str] = None
    ) -> bool:
        """
        Embed an AI agent and store it in the database
        """
        session = self._get_session()
        try:
            # Create embedding text
            agent_text = self.embedder.embed_agent(agent_data)

            # Generate embedding
            embedding = self.embedder.embed_text(agent_text)

            # Check if agent already exists
            existing = session.query(AgentEmbedding).filter_by(agent_id=agent_id).first()
            if existing:
                # Update existing
                existing.agent_content = agent_text
                existing.embedding = embedding
                existing.organization_id = organization_id
                existing.agent_name = agent_data.get('name', '')
                existing.industry = agent_data.get('industry', '')
                existing.interview_type = agent_data.get('interview_type', '')
            else:
                # Create new
                agent_embedding = AgentEmbedding(
                    agent_id=agent_id,
                    organization_id=organization_id,
                    agent_content=agent_text,
                    embedding=embedding,
                    agent_name=agent_data.get('name', ''),
                    industry=agent_data.get('industry', ''),
                    interview_type=agent_data.get('interview_type', ''),
                )
                session.add(agent_embedding)

            session.commit()
            return True

        except Exception as e:
            session.rollback()
            logger.error(f"Failed to embed and store agent {agent_id}: {e}")
            return False
        finally:
            session.close()

    def search_profiles_by_text(
        self,
        query: str,
        organization_id: Optional[str] = None,
        top_k: int = 20,
        generate_ai_explanations: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Search profiles using a natural language query.
        Embeds the query, finds similar profiles via vector similarity,
        then optionally generates AI explanations with PII stripped.
        Returns enriched profile data suitable for the Hire page.
        """
        session = self._get_session()
        try:
            logger.info(f"Searching profiles for query: '{query}' (org_id={organization_id})")

            # 1a. Analyze query for required skills (cached)
            analysis_cache_key = f"query_analysis:v1:{hashlib.md5(query.encode()).hexdigest()}"
            query_analysis = cache_get(analysis_cache_key)
            if not query_analysis:
                query_analysis = self.generator.analyze_search_query(query)
                cache_set(analysis_cache_key, query_analysis, ttl=3600)
            required_skills = set(s.lower().strip() for s in query_analysis.get('detected_skills', []))

            # 1b. Expand the query to profile-like format (cached), then embed
            query_hash = hashlib.md5(query.encode()).hexdigest()
            cache_key = f"expanded_query:v1:{query_hash}"
            expanded_query = cache_get(cache_key)
            if not expanded_query:
                expanded_query = self.generator.expand_search_query(query)
                cache_set(cache_key, expanded_query, ttl=3600)
            logger.info(f"Expanded query: '{expanded_query[:100]}...'")
            query_embedding = self.embedder.embed_text(expanded_query)
            logger.info(f"Query embedding generated: {len(query_embedding)} dims")

            # 2. Find similar profiles from the current organization
            similar_profiles = self.retriever.find_similar_profiles(
                query_embedding=query_embedding,
                organization_id=organization_id,
                top_k=top_k,
                similarity_threshold=0.0  # Allow all results, sorted by similarity
            )

            logger.info(f"Found {len(similar_profiles)} similar profiles")

            if not similar_profiles:
                return []

            # 3. Enrich with user data — batch prefetch all users, skills, experiences
            from ...models import User, Skill, Experience
            from datetime import date

            user_ids = [int(p['user_id']) for p in similar_profiles]
            users_map = {u.id: u for u in session.query(User).filter(User.id.in_(user_ids)).all()}
            skills_map = {}
            for s in session.query(Skill).filter(Skill.user_id.in_(user_ids)).all():
                skills_map.setdefault(s.user_id, []).append(s.name)
            exps_map = {}
            for e in session.query(Experience).filter(Experience.user_id.in_(user_ids)).all():
                exps_map.setdefault(e.user_id, []).append(e)

            results = []
            today = date.today()

            for profile in similar_profiles:
                user = users_map.get(int(profile['user_id']))
                if not user:
                    continue

                skill_names = [n for n in skills_map.get(user.id, []) if n]

                exp_years = 0.0
                for exp in exps_map.get(user.id, []):
                    if exp.start_date:
                        end = exp.end_date or today
                        diff = (end - exp.start_date).days / 365.25
                        exp_years += max(0, diff)

                # Skill reranking: cross-reference candidate skills vs required skills
                candidate_skills_lower = set(s.lower().strip() for s in skill_names)
                matched_required = []
                for rs in required_skills:
                    for cs in candidate_skills_lower:
                        if rs == cs or rs in cs or cs in rs:
                            matched_required.append(rs)
                            break
                matched_required = list(set(matched_required))
                skill_match_ratio = len(matched_required) / len(required_skills) if required_skills else 1.0

                # Adjusted similarity: penalize when no required skills are present
                adjusted_similarity = profile['similarity'] * (0.3 + 0.7 * skill_match_ratio)

                # Build user display data (safe PII for org internal use)
                user_data = {
                    'user_id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'profile_picture': user.profile_picture,
                    'location': user.location,
                    'employment_status': user.employment_status,
                    'current_position': user.current_position,
                    'current_company': user.current_company,
                    'plan': user.plan,
                }

                result = {
                    **user_data,
                    'similarity': round(adjusted_similarity, 4),
                    'skills': skill_names,
                    'skills_count': len(skill_names),
                    'experience_years': exp_years,
                    'education_level': profile['education_level'],
                    'match_level': self.generator._classify_match_level(adjusted_similarity),
                    'explanation': None,
                    'matching_skills': matched_required,
                    'required_skills': list(required_skills),
                    'skill_match_ratio': round(skill_match_ratio, 2),
                }

                if generate_ai_explanations:
                    ai_result = self.generator.generate_search_explanation_sync(
                        query=query,
                        profile_content=profile['profile_content'],
                        similarity_score=adjusted_similarity,
                        skills_count=len(skill_names),
                        experience_years=exp_years,
                        education_level=profile['education_level'],
                    )
                    result['explanation'] = ai_result['explanation']
                    result['match_level'] = ai_result['match_level']
                    result['matching_skills'] = ai_result['matching_skills']

                results.append(result)

            # 4. Sort: excellent first, then good, then possible, then poor;
            #    within same level, higher adjusted_similarity first
            level_order = {'excellent': 0, 'good': 1, 'possible': 2, 'poor': 3}
            results.sort(key=lambda r: (level_order.get(r['match_level'], 99), -r['similarity']))

            return results

        finally:
            session.close()

    def explain_candidate(
        self,
        user_id: str,
        query: str,
        organization_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate AI explanation for a single candidate.
        Called on-demand when user expands a row."""
        session = self._get_session()
        try:
            from ...models import User, Skill, Experience
            from datetime import date

            profile = session.query(ProfileEmbedding).filter_by(user_id=user_id).first()
            if not profile:
                return None

            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return None

            skill_names = [s.name for s in session.query(Skill).filter_by(user_id=user.id).all() if s.name]

            today = date.today()
            exp_years = 0.0
            for exp in session.query(Experience).filter_by(user_id=user.id).all():
                if exp.start_date:
                    end = exp.end_date or today
                    diff = (end - exp.start_date).days / 365.25
                    exp_years += max(0, diff)

            ai_result = self.generator.generate_search_explanation_sync(
                query=query,
                profile_content=profile.profile_content,
                similarity_score=0.0,
                skills_count=len(skill_names),
                experience_years=exp_years,
                education_level=profile.education_level,
            )
            return ai_result
        finally:
            session.close()

    def get_candidate_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get enriched candidate profile with skills, experience, education, projects, etc."""
        session = self._get_session()
        try:
            from ...models import (
                User, Skill, Experience, ProfileEmbedding,
                Project, Certification, Language, Education as Edu
            )
            from datetime import date

            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return None

            skills = [s.name for s in session.query(Skill).filter_by(user_id=user.id).all() if s.name]

            today = date.today()
            exp_years = 0.0
            experiences = []
            for exp in session.query(Experience).filter_by(user_id=user.id).all():
                if exp.start_date:
                    end = exp.end_date or today
                    diff = (end - exp.start_date).days / 365.25
                    exp_years += max(0, diff)
                experiences.append({
                    'title': exp.title,
                    'company': exp.company,
                    'description': (exp.description or '')[:300],
                    'start_date': exp.start_date.isoformat() if exp.start_date else None,
                    'end_date': exp.end_date.isoformat() if exp.end_date else None,
                })

            projects = []
            for proj in session.query(Project).filter_by(user_id=user.id).all():
                projects.append({
                    'name': proj.name,
                    'description': (proj.description or '')[:300],
                    'technologies': proj.technologies,
                })

            certifications = [
                {'name': c.name, 'issuer': c.issuer}
                for c in session.query(Certification).filter_by(user_id=user.id).all()
            ]

            languages = [
                {'name': l.name, 'proficiency': l.proficiency_level}
                for l in session.query(Language).filter_by(user_id=user.id).all()
            ]

            educations = []
            for edu in session.query(Edu).filter_by(user_id=user.id).all():
                educations.append({
                    'degree': edu.degree,
                    'school': edu.school,
                    'field': edu.field,
                    'year': edu.year,
                })

            profile_embed = session.query(ProfileEmbedding).filter_by(user_id=user_id).first()
            education_level = profile_embed.education_level if profile_embed else None

            return {
                'user_id': user.id,
                'name': user.name,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'location': user.location,
                'employment_status': user.employment_status,
                'current_position': user.current_position,
                'current_company': user.current_company,
                'plan': user.plan,
                'skills': skills,
                'skills_count': len(skills),
                'experience_years': round(exp_years, 1),
                'experiences': experiences,
                'projects': projects,
                'certifications': certifications,
                'languages': languages,
                'educations': educations,
                'education_level': education_level,
            }
        finally:
            session.close()

    def compare_candidate_with_job(
        self,
        candidate_user_id: str,
        job_id: str,
        organization_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Compare a candidate's profile against a job posting.
        Scans skills, projects, experience, certifications, and education
        to determine requirement matches."""
        session = self._get_session()
        try:
            from ...models import (
                User, Skill, Experience, Post, ProfileEmbedding,
                Project, Certification, Language, Education as Edu
            )
            from datetime import date

            candidate = session.query(User).filter_by(id=candidate_user_id).first()
            job = session.query(Post).filter_by(id=job_id).first()
            if not candidate or not job:
                return None

            # ---- Collect ALL technology mentions from the entire profile ----
            all_techs = []
            def add_text(t):
                if t:
                    all_techs.append(t)

            # 1. Formal skills
            skills = [s.name for s in session.query(Skill).filter_by(user_id=candidate.id).all() if s.name]
            all_techs.extend(skills)

            # 2. Projects (name + technologies + full description)
            projects_count = 0
            for proj in session.query(Project).filter_by(user_id=candidate.id).all():
                projects_count += 1
                add_text(proj.name)
                add_text(proj.description)
                if proj.technologies:
                    if isinstance(proj.technologies, list):
                        all_techs.extend(proj.technologies)
                    elif isinstance(proj.technologies, str):
                        all_techs.extend(t.strip() for t in proj.technologies.split(','))

            # 3. Experience (title + company + description)
            experiences_list = []
            for exp in session.query(Experience).filter_by(user_id=candidate.id).all():
                add_text(exp.title)
                add_text(exp.company)
                add_text(exp.description)
                experiences_list.append({
                    'title': exp.title,
                    'company': exp.company,
                    'description': (exp.description or '')[:300],
                    'start_date': exp.start_date.isoformat() if exp.start_date else None,
                    'end_date': exp.end_date.isoformat() if exp.end_date else None,
                })

            # 4. Certifications
            certs = []
            for c in session.query(Certification).filter_by(user_id=candidate.id).all():
                add_text(c.name)
                add_text(c.issuer)
                certs.append({'name': c.name, 'issuer': c.issuer})

            # 5. Education fields
            educations_list = []
            for edu in session.query(Edu).filter_by(user_id=candidate.id).all():
                add_text(edu.field)
                add_text(edu.degree)
                educations_list.append({
                    'degree': edu.degree,
                    'school': edu.school,
                    'field': edu.field,
                    'year': edu.year,
                })

            # Candidate experience years
            today = date.today()
            exp_years = 0.0
            for exp in session.query(Experience).filter_by(user_id=candidate.id).all():
                if exp.start_date:
                    end = exp.end_date or today
                    diff = (end - exp.start_date).days / 365.25
                    exp_years += max(0, diff)

            # Parse job requirements
            import json
            requirements_list = []
            if job.requirements:
                try:
                    parsed = json.loads(job.requirements)
                    requirements_list = parsed if isinstance(parsed, list) else []
                except (json.JSONDecodeError, TypeError):
                    requirements_list = []

            # ---- Match each requirement across the FULL profile ----
            STOP_WORDS = {'a', 'an', 'the', 'and', 'or', 'of', 'in', 'to', 'for', 'with',
                          'on', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
                          'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                          'could', 'should', 'may', 'might', 'can', 'shall', 'than',
                          'that', 'this', 'these', 'those', 'it', 'its', 'you', 'your',
                          'our', 'we', 'they', 'them', 'their', 'experience', 'knowledge',
                          'understanding', 'skills', 'ability', 'using', 'years', 'plus',
                          'strong', 'proven', 'development', 'building', 'work', 'working'}
            def extract_keywords(text):
                return set(
                    w.strip('(),.?:;"\'!-').lower()
                    for w in text.split()
                    if len(w.strip('(),.?:;"\'!-')) > 2
                    and w.strip('(),.?:;"\'!-').lower() not in STOP_WORDS
                )

            corpus_words = set()
            for source in all_techs:
                if source:
                    corpus_words.update(extract_keywords(source))

            matched = []
            missing = []
            for req in requirements_list:
                req_keywords = extract_keywords(req)
                if not req_keywords:
                    matched.append(req)
                    continue
                match_count = sum(1 for kw in req_keywords if kw in corpus_words)
                # Match if at least one keyword is found in the candidate's profile
                if match_count > 0:
                    matched.append(req)
                else:
                    missing.append(req)

            skill_ratio = len(matched) / len(requirements_list) if requirements_list else 1.0

            # Candidate education
            edu = None
            profile_embed = session.query(ProfileEmbedding).filter_by(user_id=candidate_user_id).first()
            if profile_embed:
                edu = profile_embed.education_level

            return {
                'candidate': {
                    'user_id': candidate.id,
                    'name': candidate.name,
                    'skills': skills,
                    'experience_years': exp_years,
                    'education_level': edu,
                    'employment_status': candidate.employment_status,
                    'current_position': candidate.current_position,
                    'profile_picture': candidate.profile_picture,
                    'projects_count': len(session.query(Project).filter_by(user_id=candidate.id).all()),
                    'certifications_count': len(certs),
                },
                'job': {
                    'id': job.id,
                    'title': job.title,
                    'description': (job.description or '')[:500],
                    'requirements': requirements_list,
                    'location': job.location,
                    'employment_type': job.employment_type,
                    'category': job.category,
                },
                'comparison': {
                    'skill_match': matched,
                    'missing_skills': missing,
                    'skill_match_ratio': round(skill_ratio, 2),
                    'total_required_skills': len(requirements_list),
                    'matched_skill_count': len(matched),
                    'missing_skill_count': len(missing),
                    'candidate_experience_years': round(exp_years, 1),
                    'skills_source_count': len(skills),
                    'project_techs_count': len([t for t in all_techs if t.lower() not in [s.lower() for s in skills]]),
                }
            }
        finally:
            session.close()

    def _calculate_experience_years(self, experiences: List[Dict[str, Any]]) -> float:
        """Calculate total years of experience"""
        total_years = 0
        for exp in experiences:
            start_date = exp.get('start_date')
            end_date = exp.get('end_date')
            if start_date and end_date:
                # Simple calculation - in real implementation, parse dates properly
                try:
                    start_year = int(start_date.split('-')[0]) if isinstance(start_date, str) else start_date.year
                    end_year = int(end_date.split('-')[0]) if isinstance(end_date, str) else end_date.year
                    total_years += max(0, end_year - start_year)
                except:
                    pass
        return total_years

    def _get_highest_education(self, educations: List[Dict[str, Any]]) -> Optional[str]:
        """Get the highest level of education"""
        levels = {'high school': 1, 'associate': 2, 'bachelor': 3, 'master': 4, 'phd': 5, 'doctorate': 5}
        highest_level = 0
        highest_degree = None

        for edu in educations:
            degree = edu.get('degree', '').lower()
            for level_name, level_num in levels.items():
                if level_name in degree and level_num > highest_level:
                    highest_level = level_num
                    highest_degree = edu.get('degree')

        return highest_degree
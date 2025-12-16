import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db

app = create_app()
with app.app_context():
    # Use raw SQL to avoid model import issues
    result = db.session.execute(db.text("SELECT id, email FROM users WHERE email = 'syab@recruai.com'")).fetchone()
    if result:
        user_id, email = result
        print(f'Found user: {email}, id: {user_id}')

        # Check existing agents
        agents_result = db.session.execute(db.text("SELECT name, industry FROM practice_ai_agents WHERE user_id = :user_id"), {'user_id': user_id}).fetchall()
        print(f'Existing agents: {len(agents_result)}')
        for agent in agents_result:
            print(f'  - {agent[0]}: {agent[1]}')

        # Add some practice AI agents if they don't exist
        agents_to_add = [
            {
                'name': 'Senior Software Engineer',
                'industry': 'Technology',
                'description': 'Experienced software engineer specializing in system design and technical leadership',
                'system_prompt': '''You are a Senior Software Engineer conducting technical interviews. Focus on:
- System design and architecture decisions
- Code quality, testing, and best practices
- Problem-solving approaches and trade-offs
- Leadership and mentoring experience
- Technology stack expertise and reasoning

Ask thoughtful questions that reveal the candidate's depth of experience and ability to make technical decisions.''',
                'custom_instructions': '''Emphasize practical experience over theoretical knowledge. Ask about real-world challenges they've faced and how they solved them. Pay attention to their communication skills and ability to explain complex concepts clearly.'''
            },
            {
                'name': 'Product Manager',
                'industry': 'Technology',
                'description': 'Product management expert focusing on strategy, user experience, and business impact',
                'system_prompt': '''You are a Product Manager conducting interviews. Focus on:
- Product strategy and vision
- User research and empathy
- Data-driven decision making
- Cross-functional collaboration
- Business acumen and prioritization

Ask questions that reveal how candidates think about user needs, business goals, and product development processes.''',
                'custom_instructions': '''Look for candidates who can balance user needs with business constraints. Ask about specific examples of product decisions they've made and the outcomes. Test their ability to handle ambiguity and conflicting priorities.'''
            },
            {
                'name': 'Data Scientist',
                'industry': 'Technology',
                'description': 'Data science expert specializing in machine learning, statistics, and analytical thinking',
                'system_prompt': '''You are a Data Scientist conducting technical interviews. Focus on:
- Statistical and mathematical foundations
- Machine learning algorithms and applications
- Data analysis and interpretation
- Experimental design and A/B testing
- Business impact of data science work

Ask questions that test both theoretical knowledge and practical application of data science concepts.''',
                'custom_instructions': '''Challenge candidates with real-world scenarios. Ask them to explain complex concepts in simple terms. Test their ability to identify when and how to apply different analytical approaches.'''
            },
            {
                'name': 'UX Designer',
                'industry': 'Design',
                'description': 'User experience design expert focusing on user-centered design and interface design',
                'system_prompt': '''You are a UX Designer conducting design interviews. Focus on:
- User research and usability testing
- Design thinking and problem-solving
- Visual design and interaction design
- Accessibility and inclusive design
- Design systems and consistency

Ask questions that reveal the candidate's design process, user empathy, and ability to create intuitive experiences.''',
                'custom_instructions': '''Look for candidates who can articulate their design decisions and rationale. Ask about their experience with user testing and iteration. Test their ability to balance aesthetics with functionality.'''
            }
        ]

        for agent_data in agents_to_add:
            # Check if agent already exists
            existing = db.session.execute(
                db.text("SELECT id FROM practice_ai_agents WHERE user_id = :user_id AND name = :name"),
                {'user_id': user_id, 'name': agent_data['name']}
            ).fetchone()

            if not existing:
                db.session.execute(
                    db.text("""
                        INSERT INTO practice_ai_agents (user_id, name, industry, description, system_prompt, custom_instructions, is_active, created_at, updated_at)
                        VALUES (:user_id, :name, :industry, :description, :system_prompt, :custom_instructions, true, NOW(), NOW())
                    """),
                    {
                        'user_id': user_id,
                        'name': agent_data['name'],
                        'industry': agent_data['industry'],
                        'description': agent_data['description'],
                        'system_prompt': agent_data['system_prompt'],
                        'custom_instructions': agent_data['custom_instructions']
                    }
                )
                print(f"Added agent: {agent_data['name']}")
            else:
                print(f"Agent already exists: {agent_data['name']}")

        db.session.commit()

        # Check final count
        final_count = db.session.execute(db.text("SELECT COUNT(*) FROM practice_ai_agents WHERE user_id = :user_id"), {'user_id': user_id}).scalar()
        print(f"Final agent count: {final_count}")

    else:
        print('User not found')
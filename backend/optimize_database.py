"""
Database optimization script for RecruAI
Adds indexes and optimizations for better performance with large datasets and pagination.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from extensions import db
from sqlalchemy import Index, text

def create_database_indexes():
    """Create database indexes for optimal query performance"""

    app = create_app()
    with app.app_context():
        try:
            # Use the app's database engine directly
            engine = db.get_engine()

            with engine.connect() as conn:
                # Indexes for User model
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
                """))

                # Indexes for Post model
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON posts(organization_id);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_posts_employment_type ON posts(employment_type);
                """))

                # Indexes for Application model
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_applications_post_id ON applications(post_id);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_applications_pipeline_stage ON applications(pipeline_stage);
                """))

                # Indexes for Interview model
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at DESC);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_interviews_organization_id ON interviews(organization_id);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
                """))

                # Composite indexes for common query patterns
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_applications_user_post ON applications(user_id, post_id);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_posts_org_status ON posts(organization_id, status);
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_interviews_user_status ON interviews(user_id, status);
                """))

                conn.commit()
                print("✅ Database indexes created successfully!")

        except Exception as e:
            print(f"❌ Error creating indexes: {e}")

def analyze_query_performance():
    """Analyze query performance and suggest optimizations"""

    app = create_app()
    with app.app_context():
        try:
            # Analyze table statistics
            tables = ['users', 'posts', 'applications', 'interviews']

            for table in tables:
                result = db.session.execute(text(f"""
                    SELECT
                        schemaname,
                        tablename,
                        n_tup_ins AS inserts,
                        n_tup_upd AS updates,
                        n_tup_del AS deletes,
                        n_live_tup AS live_rows,
                        n_dead_tup AS dead_rows
                    FROM pg_stat_user_tables
                    WHERE tablename = '{table}';
                """)).fetchone()

                if result:
                    print(f"\n📊 Table: {table}")
                    print(f"   Live rows: {result.live_rows}")
                    print(f"   Dead rows: {result.dead_rows}")
                    print(f"   Inserts: {result.inserts}")
                    print(f"   Updates: {result.updates}")
                    print(f"   Deletes: {result.deletes}")

            # Check for slow queries (if pg_stat_statements is available)
            try:
                slow_queries = db.session.execute(text("""
                    SELECT
                        query,
                        calls,
                        total_time,
                        mean_time,
                        rows
                    FROM pg_stat_statements
                    WHERE mean_time > 100  -- queries taking more than 100ms on average
                    ORDER BY mean_time DESC
                    LIMIT 10;
                """)).fetchall()

                if slow_queries:
                    print("\n🐌 Slow Queries (>100ms average):")
                    for query in slow_queries:
                        print(f"   Query: {query.query[:100]}...")
                        print(f"   Calls: {query.calls}, Avg Time: {query.mean_time:.2f}ms")
                        print()
                else:
                    print("\n✅ No slow queries detected!")

            except Exception:
                print("\n⚠️  pg_stat_statements not available for query analysis")

        except Exception as e:
            print(f"❌ Error analyzing performance: {e}")

def create_partitioning_strategy():
    """Create partitioning strategy for large tables (if needed)"""

    app = create_app()
    with app.app_context():
        try:
            # Check table sizes
            large_tables = db.session.execute(text("""
                SELECT
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
            """)).fetchall()

            print("\n📏 Table Sizes:")
            for table in large_tables:
                print(f"   {table.tablename}: {table.size}")

            # Suggest partitioning for tables > 1GB
            for table in large_tables:
                size_str = table.size
                if 'GB' in size_str or ('MB' in size_str and float(size_str.split()[0]) > 1000):
                    print(f"\n⚡ Consider partitioning table '{table.tablename}' ({size_str})")
                    print("   Suggested partitioning strategies:")
                    print("   - Time-based partitioning for created_at fields")
                    print("   - Hash partitioning for high-cardinality fields")
                    print("   - Range partitioning for sequential IDs")

        except Exception as e:
            print(f"❌ Error checking table sizes: {e}")

if __name__ == "__main__":
    print("🔧 RecruAI Database Optimization Script")
    print("=" * 50)

    create_database_indexes()
    analyze_query_performance()
    create_partitioning_strategy()

    print("\n✅ Database optimization complete!")
    print("\n💡 Recommendations:")
    print("   - Monitor query performance regularly")
    print("   - Consider connection pooling for high traffic")
    print("   - Implement caching for frequently accessed data")
    print("   - Use database read replicas for heavy read workloads")
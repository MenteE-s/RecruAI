from flask import request, jsonify
from sqlalchemy import desc
from . import api_bp
from ..extensions import db
from ..models.system_issue import SystemIssue


@api_bp.route('/system-issues', methods=['GET'])
def get_system_issues():
    """Get all system issues with filtering and pagination"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status_filter = request.args.get('status', 'all')
        type_filter = request.args.get('type', 'all')

        # Build query
        query = SystemIssue.query

        # Apply filters
        if status_filter != 'all':
            query = query.filter(SystemIssue.status == status_filter)
        if type_filter != 'all':
            query = query.filter(SystemIssue.issue_type == type_filter)

        # Order by creation date (newest first)
        query = query.order_by(desc(SystemIssue.created_at))

        # Get total count for pagination
        total_issues = query.count()

        # Apply pagination
        issues = query.offset((page - 1) * per_page).limit(per_page).all()

        # Separate active and resolved issues
        active_issues = [issue for issue in issues if issue.status in ['open', 'investigating', 'in_progress']]
        resolved_issues = [issue for issue in issues if issue.status in ['resolved', 'closed']]

        return jsonify({
            'success': True,
            'data': {
                'active_issues': [issue.to_dict() for issue in active_issues],
                'resolved_issues': [issue.to_dict() for issue in resolved_issues],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_issues,
                    'pages': (total_issues + per_page - 1) // per_page
                }
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/system-issues', methods=['POST'])
def create_system_issue():
    """Create a new system issue"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['title', 'description', 'issue_type', 'severity']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400

        # Create new issue
        new_issue = SystemIssue(
            title=data['title'],
            description=data['description'],
            issue_type=data['issue_type'],
            severity=data['severity'],
            user_email=data.get('email'),  # Optional email
            status='open'  # New issues start as open
        )

        db.session.add(new_issue)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Issue reported successfully',
            'data': new_issue.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/system-issues/<int:issue_id>', methods=['PUT'])
def update_system_issue(issue_id):
    """Update an existing system issue (for admin use)"""
    try:
        issue = SystemIssue.query.get_or_404(issue_id)
        data = request.get_json()

        # Update allowed fields
        allowed_fields = ['status', 'resolution']
        for field in allowed_fields:
            if field in data:
                setattr(issue, field, data[field])

        # Set resolved timestamp if status changed to resolved/closed
        if data.get('status') in ['resolved', 'closed'] and not issue.resolved_at:
            from datetime import datetime
            issue.resolved_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Issue updated successfully',
            'data': issue.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api_bp.route('/system-issues/stats', methods=['GET'])
def get_system_issue_stats():
    """Get statistics about system issues"""
    try:
        total_issues = SystemIssue.query.count()
        open_issues = SystemIssue.query.filter(SystemIssue.status.in_(['open', 'investigating', 'in_progress'])).count()
        resolved_issues = SystemIssue.query.filter(SystemIssue.status.in_(['resolved', 'closed'])).count()

        # Get issues by type
        issues_by_type = {}
        for issue_type in ['bug', 'feature_request', 'improvement', 'other']:
            count = SystemIssue.query.filter(SystemIssue.issue_type == issue_type).count()
            issues_by_type[issue_type] = count

        # Get issues by severity
        issues_by_severity = {}
        for severity in ['low', 'medium', 'high', 'critical']:
            count = SystemIssue.query.filter(SystemIssue.severity == severity).count()
            issues_by_severity[severity] = count

        return jsonify({
            'success': True,
            'data': {
                'total_issues': total_issues,
                'open_issues': open_issues,
                'resolved_issues': resolved_issues,
                'issues_by_type': issues_by_type,
                'issues_by_severity': issues_by_severity
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
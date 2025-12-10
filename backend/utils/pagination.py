"""
Pagination utilities for RecruAI API endpoints
Provides efficient pagination for large datasets to prevent memory issues and improve performance.
"""

from flask import request
from sqlalchemy import desc
from typing import Dict, List, Any, Tuple


class Pagination:
    """Pagination utility class for SQLAlchemy queries"""

    def __init__(self, query, page: int = 1, per_page: int = 20, max_per_page: int = 100):
        """
        Initialize pagination

        Args:
            query: SQLAlchemy query object
            page: Current page number (1-based)
            per_page: Number of items per page
            max_per_page: Maximum allowed items per page
        """
        self.query = query
        self.page = max(1, page)
        self.per_page = min(max(1, per_page), max_per_page)
        self.max_per_page = max_per_page

    def paginate(self) -> Dict[str, Any]:
        """
        Execute paginated query and return results with metadata

        Returns:
            Dict containing items, pagination metadata, and total counts
        """
        # Calculate offset
        offset = (self.page - 1) * self.per_page

        # Get total count efficiently
        total = self.query.count()

        # Get paginated items
        items = self.query.offset(offset).limit(self.per_page).all()

        # Calculate pagination metadata
        total_pages = (total + self.per_page - 1) // self.per_page  # Ceiling division

        return {
            'items': items,
            'pagination': {
                'page': self.page,
                'per_page': self.per_page,
                'total': total,
                'total_pages': total_pages,
                'has_next': self.page < total_pages,
                'has_prev': self.page > 1,
                'next_page': self.page + 1 if self.page < total_pages else None,
                'prev_page': self.page - 1 if self.page > 1 else None
            }
        }


def get_pagination_params() -> Tuple[int, int]:
    """
    Extract pagination parameters from request args

    Returns:
        Tuple of (page, per_page)
    """
    try:
        page = int(request.args.get('page', 1))
    except (ValueError, TypeError):
        page = 1

    try:
        per_page = int(request.args.get('per_page', 20))
    except (ValueError, TypeError):
        per_page = 20

    return page, per_page


def paginated_response(items: List[Any], pagination: Dict[str, Any], item_serializer=None) -> Dict[str, Any]:
    """
    Create a standardized paginated response

    Args:
        items: List of items to serialize
        pagination: Pagination metadata dict
        item_serializer: Optional function to serialize individual items

    Returns:
        Dict with serialized items and pagination metadata
    """
    if item_serializer:
        serialized_items = [item_serializer(item) for item in items]
    else:
        # Try to call to_dict() method if available
        serialized_items = []
        for item in items:
            if hasattr(item, 'to_dict'):
                serialized_items.append(item.to_dict())
            else:
                serialized_items.append(item)

    return {
        'data': serialized_items,
        'pagination': pagination
    }


def apply_filters_and_sorting(query, model_class, filters: Dict[str, Any] = None, sort_by: str = None, sort_order: str = 'desc'):
    """
    Apply filters and sorting to a query

    Args:
        query: SQLAlchemy query object
        model_class: The model class for column access
        filters: Dict of field_name: value pairs for filtering
        sort_by: Field name to sort by
        sort_order: 'asc' or 'desc'

    Returns:
        Modified query object
    """
    # Apply filters
    if filters:
        for field, value in filters.items():
            if hasattr(model_class, field) and value is not None:
                column = getattr(model_class, field)
                # Handle different filter types
                if isinstance(value, str):
                    # Case-insensitive partial match for strings
                    query = query.filter(column.ilike(f'%{value}%'))
                elif isinstance(value, list):
                    # IN clause for lists
                    query = query.filter(column.in_(value))
                else:
                    # Exact match for other types
                    query = query.filter(column == value)

    # Apply sorting
    if sort_by and hasattr(model_class, sort_by):
        column = getattr(model_class, sort_by)
        if sort_order.lower() == 'asc':
            query = query.order_by(column.asc())
        else:
            query = query.order_by(column.desc())
    else:
        # Default sorting by created_at if available, otherwise by id
        if hasattr(model_class, 'created_at'):
            query = query.order_by(desc(model_class.created_at))
        elif hasattr(model_class, 'id'):
            query = query.order_by(desc(model_class.id))

    return query


def get_request_filters(model_class) -> Dict[str, Any]:
    """
    Extract filter parameters from request args based on model fields

    Args:
        model_class: The model class to check for valid filter fields

    Returns:
        Dict of valid filters
    """
    filters = {}
    valid_fields = [column.name for column in model_class.__table__.columns]

    for arg, value in request.args.items():
        # Skip pagination and sorting parameters
        if arg in ['page', 'per_page', 'sort_by', 'sort_order']:
            continue

        # Only include valid model fields
        if arg in valid_fields and value:
            # Try to convert to appropriate type
            column = getattr(model_class, arg)
            if hasattr(column.type, 'python_type'):
                try:
                    if column.type.python_type == bool:
                        filters[arg] = value.lower() in ('true', '1', 'yes')
                    elif column.type.python_type in (int, float):
                        filters[arg] = column.type.python_type(value)
                    else:
                        filters[arg] = value
                except (ValueError, TypeError):
                    # If conversion fails, treat as string
                    filters[arg] = value
            else:
                filters[arg] = value

    return filters


def get_sorting_params(default_sort: str = 'created_at', default_order: str = 'desc') -> Tuple[str, str]:
    """
    Extract sorting parameters from request args

    Returns:
        Tuple of (sort_by, sort_order)
    """
    sort_by = request.args.get('sort_by', default_sort)
    sort_order = request.args.get('sort_order', default_order)

    # Validate sort_order
    if sort_order.lower() not in ['asc', 'desc']:
        sort_order = default_order

    return sort_by, sort_order
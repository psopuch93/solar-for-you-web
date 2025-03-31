"""
Custom template filters for the app
"""
from django import template

register = template.Library()

@register.filter
def multiply(value, arg):
    """Multiply the value by argument"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0
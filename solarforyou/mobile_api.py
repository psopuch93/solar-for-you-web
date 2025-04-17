# mobile_api.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
import json

@csrf_exempt
def mobile_login(request):
    """Dedicated endpoint for mobile login"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST method allowed'}, status=405)

    try:
        # Parse the request body
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
    except json.JSONDecodeError:
        # Fallback to POST parameters if body isn't valid JSON
        username = request.POST.get('username')
        password = request.POST.get('password')

    if not username or not password:
        return JsonResponse({
            'success': False,
            'message': 'Username and password required'
        }, status=400)

    # Authenticate the user
    user = authenticate(request, username=username, password=password)

    if user is not None:
        # Login the user
        login(request, user)

        # Prepare the response
        response_data = {
            'success': True,
            'message': 'Login successful',
            'email': user.email,
            'access': 'user'
        }

        # Add user's name if available
        if hasattr(user, 'first_name') and hasattr(user, 'last_name'):
            if user.first_name or user.last_name:
                response_data['name'] = f"{user.first_name} {user.last_name}".strip()

        return JsonResponse(response_data)
    else:
        return JsonResponse({
            'success': False,
            'message': 'Invalid credentials'
        }, status=401)
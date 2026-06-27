from django.urls import path
from .views import StartInterviewView, SubmitAnswerView, UserInterviewHistoryView, RegisterUserView 

urlpatterns = [
    path('start/', StartInterviewView.as_view(), name='start-interview'),
    path('submit/', SubmitAnswerView.as_view(), name='submit-answer'),
    path('history/', UserInterviewHistoryView.as_view(), name='interview-history'),
    path('register/', RegisterUserView.as_view(), name='register'), 
  
]
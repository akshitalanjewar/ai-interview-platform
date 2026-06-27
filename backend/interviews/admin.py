from django.contrib import admin
from .models import InterviewSession, InterviewQuestion

@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'target_role', 'status', 'created_at')

@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'question_text', 'ai_score', 'created_at')

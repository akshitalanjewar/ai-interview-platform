from rest_framework import serializers
from .models import InterviewSession, InterviewQuestion

class InterviewQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewQuestion
        fields = ['id', 'question_text', 'user_answer', 'ai_feedback', 'ai_score']

class InterviewSessionSerializer(serializers.ModelSerializer):
    
    questions = InterviewQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewSession
        fields = ['id', 'target_role', 'experience_level', 'status', 'created_at', 'questions']
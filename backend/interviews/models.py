from django.db import models
from django.conf import settings

class InterviewSession(models.Model):
    STATUS_CHOICES = [
        ('started', 'Started'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interviews')
    target_role = models.CharField(max_length=100)
    experience_level = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='started')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.target_role} ({self.status})"


class InterviewQuestion(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    
    
    user_answer = models.TextField(blank=True, null=True)
    ai_feedback = models.TextField(blank=True, null=True)
    ai_score = models.FloatField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.session.id} - Q: {self.question_text[:30]}..."

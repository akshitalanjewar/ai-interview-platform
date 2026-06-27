import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny  
from django.contrib.auth import get_user_model  
User = get_user_model() 
from .models import InterviewSession, InterviewQuestion
from .serializers import InterviewSessionSerializer
from google import genai

class RegisterUserView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not email or not password:
            return Response(
                {"error": "Please provide username, email, and password."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if " " in username:
            return Response(
                {"error": "Username cannot contain spaces. Use underscores (_) instead."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists. Try another one."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            return Response(
                {"message": f"User '{user.username}' created successfully!"}, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": f"Database error: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class StartInterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_role = request.data.get('target_role')
        if not target_role:
            return Response({"error": "Target role is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user 

        session = InterviewSession.objects.create(
            user=user,
            target_role=target_role,
            experience_level="Fresher"  
        )

        client = genai.Client(api_key="GEMINI_API_KEY") 

        prompt = f"""
        You are an expert technical interviewer. Generate exactly 3 technical interview questions for a fresher applying for the role of '{target_role}'.
        Return the response strictly as a raw JSON list of strings, like this:
        [
            "Question 1?",
            "Question 2?",
            "Question 3?"
        ]
        Do not include any markdown formatting like ```json or anything else. Just return the valid JSON array string.
        """

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            sample_questions = json.loads(response.text.strip())
        except Exception:
            sample_questions = [
                f"What are the core concepts required for a {target_role} role?",
                "Explain a recent project you built using relevant technologies.",
                "How do you debug issues in your code?"
            ]

        for q_text in sample_questions:
            InterviewQuestion.objects.create(session=session, question_text=q_text)

        serializer = InterviewSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]  

    def post(self, request):
        question_id = request.data.get('question_id')
        user_answer = request.data.get('user_answer')

        if not question_id or not user_answer:
            return Response(
                {"error": "Both question_id and user_answer are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            question = InterviewQuestion.objects.get(id=question_id)
            session = question.session
            
            client = genai.Client(api_key="GEMINI_API_KEY") 
            
            prompt = f"""
            You are an expert technical interviewer. Evaluate the following candidate's answer.
            
            Question: {question.question_text}
            Candidate Answer: {user_answer}
            
            Provide the evaluation strictly in the following JSON format:
            {{
                "score": <give a float score out of 10, e.g. 7.5>,
                "feedback": "<detailed constructive feedback in 2-3 lines highlighting what was good and what can be improved>"
            }}
            Do not include any markdown formatting like ```json or anything else. Just return the raw JSON string.
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            
            try:
                ai_data = json.loads(response.text.strip())
                ai_score = ai_data.get('score', 5.0)
                ai_feedback = ai_data.get('feedback', 'Good attempt.')
            except Exception:
                ai_score = 7.0
                ai_feedback = response.text.strip()

            question.user_answer = user_answer
            question.ai_score = ai_score
            question.ai_feedback = ai_feedback
            question.save()

            unanswered_questions = session.questions.filter(user_answer__isnull=True).count()
            
            if unanswered_questions == 0:
                session.status = "completed"
                session.save()

            return Response({
                "message": "Answer successfully evaluated by Gemini AI!",
                "question_id": question.id,
                "user_answer": question.user_answer,
                "ai_score": question.ai_score,
                "ai_feedback": question.ai_feedback
            }, status=status.HTTP_200_OK)

        except InterviewQuestion.DoesNotExist:
            return Response(
                {"error": "Question not found in the database."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        

class UserInterviewHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = InterviewSession.objects.filter(user=request.user).order_by('-created_at')
        serializer = InterviewSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
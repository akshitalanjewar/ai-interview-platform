from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'full_name', 
            'experience_level', 'target_role', 'github', 'linkedin', 'profile_image', 'resume', 'skills'
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            experience_level=validated_data.get('experience_level', 'Fresher'),
            target_role=validated_data.get('target_role', ''),
            github=validated_data.get('github'),
            linkedin=validated_data.get('linkedin'),
            profile_image=validated_data.get('profile_image'),
            resume=validated_data.get('resume'),
            skills=validated_data.get('skills')
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'experience_level', 
            'target_role', 'github', 'linkedin', 'profile_image',
            'resume', 'skills'
        ]
        read_only_fields = ['username', 'email']
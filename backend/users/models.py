from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    full_name = models.CharField(max_length=255)
    github = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)
    
    
    resume = models.FileField(upload_to="resumes/", blank=True, null=True)
    skills = models.TextField(blank=True, null=True)

    EXPERIENCE_LEVEL = [
        ("Fresher", "Fresher"),
        ("Experienced", "Experienced"),
    ]

    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVEL,
        default="Fresher",
    )

    target_role = models.CharField(max_length=100, blank=True)
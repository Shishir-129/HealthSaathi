from django.db import models
from django.contrib.auth.models import User
import hashlib


class TriageSession(models.Model):
    RISK_CHOICES = [
        ('HIGH',   'High'),
        ('MEDIUM', 'Medium'),
        ('LOW',    'Low'),
    ]
    
    symptoms = models.TextField(default='')
    symptom_hash = models.CharField(max_length=64, blank=True, default='')
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES)
    advice = models.TextField(blank=True, default='')
    action = models.TextField(blank=True, default='')
    nepali_advice = models.TextField(blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    brief_advice = models.TextField(blank=True, default='')
    detailed_advice = models.TextField(blank=True, default='')
    food_eat = models.TextField(blank=True, default='')
    food_avoid = models.TextField(blank=True, default='')
    dos = models.TextField(blank=True, default='')
    donts = models.TextField(blank=True, default='')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='triage_sessions')
    user_email = models.EmailField(blank=True, default='')
    session_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.risk_level} - {self.created_at}"
    
    def save(self, *args, **kwargs):
        if self.symptoms and not self.symptom_hash:
            self.symptom_hash = hashlib.sha256(
                self.symptoms.lower().strip().encode()
            ).hexdigest()
        super().save(*args, **kwargs)
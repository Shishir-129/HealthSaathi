from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TriageSession


class TriageRequestSerializer(serializers.Serializer):
    symptoms = serializers.CharField(
        max_length=1000,
        min_length=3,
        error_messages={
            'min_length': 'Please describe your symptoms in more detail.',
            'max_length': 'Symptoms description is too long.',
            'blank':      'Symptoms cannot be empty.',
            'required':   'Please provide your symptoms.',
        }
    )
    lat = serializers.FloatField(required=False, allow_null=True, default=None)
    lng = serializers.FloatField(required=False, allow_null=True, default=None)
    district = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default=''
    )
    session_id = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default=''
    )


class TriageSessionSerializer(serializers.ModelSerializer):
    """Serializer for TriageSession model - used for history endpoints"""
    class Meta:
        model = TriageSession
        fields = [
            'id', 'session_id', 'symptoms', 'risk_level', 'district', 
            'created_at', 'brief_advice', 'detailed_advice', 'food_eat', 
            'food_avoid', 'dos', 'donts', 'nepali_advice'
        ]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=6, write_only=True, required=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True, required=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True, default='')
    blood_group = serializers.CharField(max_length=5, required=False, allow_blank=True, default='')

    def validate_blood_group(self, value):
        """Validate blood group is one of allowed choices or empty"""
        if value and value not in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            raise serializers.ValidationError(
                "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"
            )
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already registered.")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['name'],
            password=validated_data['password']
        )
        
        # Save phone number and blood group to UserProfile
        if hasattr(user, 'profile'):
            user.profile.phone_number = validated_data.get('phone_number', '')
            user.profile.blood_group = validated_data.get('blood_group', '')
            user.profile.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name']


class UserProfileSerializer(serializers.Serializer):
    """Serializer for user profile with phone and blood group"""
    id = serializers.IntegerField(source='user.id', read_only=True)
    name = serializers.CharField(source='user.first_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    blood_group = serializers.CharField(max_length=5, required=False, allow_blank=True)
    
    def validate_blood_group(self, value):
        """Validate blood group is one of allowed choices or empty"""
        if value and value not in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            raise serializers.ValidationError(
                "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"
            )
        return value
    
    def update(self, instance, validated_data):
        """Update phone_number and blood_group only"""
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.blood_group = validated_data.get('blood_group', instance.blood_group)
        instance.save()
        return instance
from rest_framework import serializers
from django.contrib.auth.models import User


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


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=6, write_only=True, required=True)
    confirm_password = serializers.CharField(min_length=6, write_only=True, required=True)

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
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name']
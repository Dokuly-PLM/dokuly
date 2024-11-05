from rest_framework import serializers
from timetracking.models import EmployeeTime
from projects.serializers import ProjectSerializer, ProjectSerializerWithCustomer
from projects.serializers import TaskSerializer


class EmployeeTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTime
        fields = '__all__'


class EmployeeTimeWithProjectAndTaskSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    task_id = TaskSerializer(read_only=True)

    class Meta:
        model = EmployeeTime
        fields = ['user', 'date', 'project', 'task', 'task_id',
                  'start_time', 'stop_time', 'hour', 'comment']


class EmployeeTimeSerializerWithBillable(serializers.ModelSerializer):
    is_billable = serializers.SerializerMethodField()
    project = ProjectSerializerWithCustomer(read_only=True)
    task_id = TaskSerializer(read_only=True)

    class Meta:
        model = EmployeeTime
        fields = ('id', 'user', 'date', 'project', 'task', 'task_id',
                  'start_time', 'stop_time', 'hour', 'comment', 'is_billable')

    def get_is_billable(self, obj):
        return obj.task_id.is_billable if obj.task_id else None

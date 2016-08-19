from rest_framework import serializers
from .models import ExcelFile

# Serializers define the API representation.
class XMLSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ExcelFile
        fields = ('file_name','docfile')

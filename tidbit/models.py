from django.db import models

class ExcelFile(models.Model):
    file_name = models.CharField(max_length=200)
    docfile = models.FileField(upload_to='documents')

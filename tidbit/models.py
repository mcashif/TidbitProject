from django.db import models

class ExcelFile(models.Model):
    file_name = models.CharField(max_length=200)
    docfile = models.FileField(upload_to='documents')


class XMLData(models.Model):
    nodeName = models.CharField(max_length=200,null=True)
    nodeparentName = models.CharField(max_length=200,null=True)
    nodeparentCode = models.IntegerField(default=0)
    nodeattribute = models.CharField(max_length=520,null=True)
    nodedata = models.CharField(max_length=1024,null=True)
    linktoparent = models.CharField(max_length=5024,null=True)

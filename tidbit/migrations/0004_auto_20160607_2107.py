# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-06-07 21:07
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tidbit', '0003_auto_20160607_2051'),
    ]

    operations = [
        migrations.AlterField(
            model_name='xmldata',
            name='nodeName',
            field=models.CharField(max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='xmldata',
            name='nodeattribute',
            field=models.CharField(max_length=520, null=True),
        ),
        migrations.AlterField(
            model_name='xmldata',
            name='nodedata',
            field=models.CharField(max_length=1024, null=True),
        ),
        migrations.AlterField(
            model_name='xmldata',
            name='nodeparentName',
            field=models.CharField(max_length=200, null=True),
        ),
    ]

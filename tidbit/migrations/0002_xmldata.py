# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-06-07 20:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tidbit', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='XMLData',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node_name', models.CharField(max_length=200)),
                ('node_parentName', models.CharField(max_length=200)),
                ('node_attribute', models.CharField(max_length=520)),
                ('node_data', models.CharField(max_length=1024)),
            ],
        ),
    ]

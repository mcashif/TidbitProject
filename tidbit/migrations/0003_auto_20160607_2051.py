# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-06-07 20:51
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tidbit', '0002_xmldata'),
    ]

    operations = [
        migrations.RenameField(
            model_name='xmldata',
            old_name='node_name',
            new_name='nodeName',
        ),
        migrations.RenameField(
            model_name='xmldata',
            old_name='node_attribute',
            new_name='nodeattribute',
        ),
        migrations.RenameField(
            model_name='xmldata',
            old_name='node_data',
            new_name='nodedata',
        ),
        migrations.RenameField(
            model_name='xmldata',
            old_name='node_parentName',
            new_name='nodeparentName',
        ),
    ]
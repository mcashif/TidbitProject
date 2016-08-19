from django.conf.urls import url
from rest_framework import routers
from . import views


urlpatterns = [
    url(r'^process/$', views.makeHdfFile, name='makeHdfFile'),
]

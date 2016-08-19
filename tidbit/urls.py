from django.conf.urls import url
from . import views


urlpatterns = [
    url(r'^process/$', views.makeHdfFile, name='makeHdfFile'),
]

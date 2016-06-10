from django.contrib import admin
from .models import ExcelFile,XMLData
from import_export.admin import ImportExportModelAdmin

# Register your models here.
# Register your models here.

class XMLDataAdmin(ImportExportModelAdmin):

    show_full_result_count = True
    list_display = ('id','nodeName','nodeparentName','nodeattribute', 'nodedata','nodeparentCode','linktoparent')
    list_filter = ('nodeName','nodeparentName',)
    search_fields = ['id','nodeName']

admin.site.register(XMLData,XMLDataAdmin)

from django.shortcuts import render
from django.http import HttpResponse
from .forms import DocumentForm
from .models import ExcelFile
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
import os
from django.conf import settings
from django.conf.urls.static import static
import openpyxl
from openpyxl.utils import (_get_column_letter)
from django.views.static import serve



def isCellEmpty(cell):

    if cell.value is None:
        return True
    else:
        if(isCellEmptSpaces(cell)):
            return True

    return False

def isCellEmptSpaces(cell):
    val=str(cell.value)
    if(val==' '):
        return True

    return False

def isCellFormula(cell):

    val = str(cell.value)
    if(val.startswith('=')):
        return True

    return False


def isCellConnected(sheet,col,row):

    hr=sheet.get_highest_row()+1
    hc=sheet.get_highest_column()+1

    #check Right if value return True
    if(col!=hc):
        if(isCellEmpty(sheet.cell(column=col+1, row=row))==False):
            return True

    #check Below if value return True
    if(row!=hr):
        if(isCellEmpty(sheet.cell(column=col, row=row+1))==False):
            return True

    #check Left,Boundry Column Elements, if value return True
    if(col>1):
        if(isCellEmpty(sheet.cell(column=col-1, row=row))==False):
            return True

    #check top,Boundry Column Elements, if value return True
    if(row>1):
        if(isCellEmpty(sheet.cell(column=col, row=row-1))==False):
            return True


    return False


def cellRefferendinSheet(sheet,cell):

    for row in sheet.rows:
        for cellRow in row:
            cellValue=str(cellRow.value)
            cellCordinate=str(cell.coordinate)
            if ( cellValue.find(cellCordinate)>-1 & cellValue.find("!")==-1):
                return "intermidiate equation " + cellRow.coordinate

    return "output"

def getFormulaType(sheet,cell,col,row):

    valStr=str(cell.value)
    valCordinate=str(cell.coordinate)

    if "!" in valStr:
        return "input"

    return cellRefferendinSheet(sheet,cell)



def getGroup(sheet,col,row):

#Return if Empty
    if(isCellEmpty(sheet.cell(column=col, row=row))):
        return sheet.cell(column=col, row=row).value


    if(isCellFormula(sheet.cell(column=col, row=row))):
        return getFormulaType(sheet,sheet.cell(column=col, row=row),col,row)
    else:
        if(isCellConnected(sheet,col,row)==False):
                return str(sheet.cell(column=col, row=row).value)+"(label)"

    return str(sheet.cell(column=col, row=row).value)+"(variable)"


def processWorkBook(path):
    workBook = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path)
    workSheet = workBook.get_active_sheet()

    processedBook = openpyxl.Workbook()
    processedSheet = processedBook.get_sheet_by_name('Sheet')

    hr=workSheet.get_highest_row()
    hc=workSheet.get_highest_column()

    for row in range(1, hr+1):
        for col in range(1, hc+1):
                _ = processedSheet.cell(column=col, row=row, value=getGroup(workSheet,col,row))


    processedBook.save(settings.PROJECT_ROOT+"/media/documents/pathoutput.xlsx")

    return settings.PROJECT_ROOT+"/media/documents/pathoutput.xlsx"


def index(request):

    return HttpResponse("Welcome- Under Construction")


def upload(request):

    # Handle file upload
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            newdoc = ExcelFile(docfile = request.FILES['docfile'])
            newdoc.save()
            fileSheet=processWorkBook(newdoc.docfile.name)
            # Redirect to the document list after POST
            #return HttpResponseRedirect(reverse('tidit.views.upload'))
            return serve(request, os.path.basename(fileSheet), os.path.dirname(fileSheet))
            #HttpResponse(processfile(newdoc.docfile.name))
    else:
        form = DocumentForm() # A empty, unbound form

    # Load documents for the list page
    documents = ExcelFile.objects.all()

    # Render list page with the documents and the form
    return render_to_response(
        'tidbit/upload.html',
        {'documents': documents, 'form': form},
        context_instance=RequestContext(request)
    )

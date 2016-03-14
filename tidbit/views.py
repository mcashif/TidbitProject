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
from openpyxl import load_workbook
from openpyxl.utils import (_get_column_letter)
from django.views.static import serve
import unicodedata
import h5py as hdf
from django.utils.encoding import smart_str




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


def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        pass
 
    try:
        unicodedata.numeric(s)
        return True
    except (TypeError, ValueError):
        pass
 
    return False

def isCellNumber(cell):
    val = str(cell.value)
    if(is_number(val)==True):
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


def findTopVaiable(sheet, cell, col, row):
    
    for row in range(row,0,-1):
        if(isCellEmpty(sheet.cell(column=col, row=row))==True):
            continue
        value=str(sheet.cell(column=col, row=row).value)
        cell=sheet.cell(column=col, row=row)
        if(isCellFormula(cell)==False):
            if(is_number(value)==False):
                return value
    
    return "No Top Heading"
def findLeftVaiable(sheet, cell, col, row):
    
    for col in range(col,0,-1):
        if(isCellEmpty(sheet.cell(column=col, row=row))==True):
            continue
        value=str(sheet.cell(column=col, row=row).value)
        cell=sheet.cell(column=col, row=row)
        if(isCellFormula(cell)==False):
            if(is_number(value)==False):
                return value
    
    return "No Left Heading"

def cellNumberUsedInSheet(sheet,cell,colv,rowv):
    
     for row in sheet.rows:
        for cellRow in row:
            cellValue=str(cellRow.value)
            cellCordinate=str(cell.coordinate)
            if ( cellValue.find(cellCordinate)>-1 & cellValue.find("!")==-1):
                return "("+str(cell.value)+")"+"(Intermediate Cell)" + "(Used at:"+cellRow.coordinate+")"+"("+findTopVaiable(sheet,cell,colv,rowv)+")"+"("+findLeftVaiable(sheet,cell,colv,rowv)+")"

     return "("+str(cell.value)+")"+"(Output)" +"("+findTopVaiable(sheet,cell,colv,rowv)+")"+"("+findLeftVaiable(sheet,cell,colv,rowv)+")"

def cellUsedInSheet(sheet,cell,formulaOutput,colv,rowv):

    for row in sheet.rows:
        for cellRow in row:
            cellValue=str(cellRow.value)
            cellCordinate=str(cell.coordinate)
            if ( cellValue.find(cellCordinate)>-1 & cellValue.find("!")==-1):
                return "("+str(cell.value)+")"+"("+formulaOutput+")"+"(Intermediate Equation)" + "(Used at:"+cellRow.coordinate+")"+"("+findTopVaiable(sheet,cell,colv,rowv)+")"+"("+findLeftVaiable(sheet,cell,colv,rowv)+")"

    return "("+str(cell.value)+")"+"("+formulaOutput+")"+"(Output)" +"("+findTopVaiable(sheet,cell,colv,rowv)+")"+"("+findLeftVaiable(sheet,cell,colv,rowv)+")"


def getFormulaType(sheet,cell,col,row,formulaOutput):

    valStr=str(cell.value)
    valCordinate=str(cell.coordinate)

    if "!" in valStr:
        return "("+valStr+")"+"("+formulaOutput+")"+"(input)"+"("+findTopVaiable(sheet,cell,col,row)+")"+"("+findLeftVaiable(sheet,cell,col,row)+")"


    return cellUsedInSheet(sheet,cell,formulaOutput,col,row)



def getValue(sheetformula,sheetvalue,col,row):

#Return if Empty
    if(isCellEmpty(sheetformula.cell(column=col, row=row))):
        return sheetformula.cell(column=col, row=row).value


    if(isCellNumber(sheetformula.cell(column=col, row=row))):
        return cellNumberUsedInSheet(sheetformula,sheetformula.cell(column=col, row=row),col,row)
    else:
        if(isCellFormula(sheetformula.cell(column=col, row=row))):
            return getFormulaType(sheetformula,sheetformula.cell(column=col, row=row),col,row,str(sheetvalue.cell(column=col, row=row).value))
        else:
            if(isCellConnected(sheetformula,col,row)==False):
                    return str(sheetformula.cell(column=col, row=row).value)+"(label)"

    return str(sheetformula.cell(column=col, row=row).value)+"(variable)"


def getValueEx(sheetformula,sheetvalue,col,row,sheet):

#Return if Empty
    if(isCellEmpty(sheetformula.cell(column=col, row=row))):
        return 0


    value=str(sheetvalue.cell(column=col, row=row).value)
    formula=str(sheetformula.cell(column=col, row=row).value)
    
    if(isCellNumber(sheetformula.cell(column=col, row=row))):
        val="\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Value"+"\""+","+"\""+value+"\""+","+"\n" \
            +"\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Top-Label"+"\""+","+"\""+findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)+"\""+","+"\n" \
            +"\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Left-Label"+"\""+","+"\""+findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)+"\""+","+"\n" 
        return val
    else:
        if(isCellFormula(sheetformula.cell(column=col, row=row))):
            val="\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Formula"+"\""+","+"\""+formula+"\""+","+"\n" \
                +"\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Value"+"\""+","+"\""+value+"\""+","+"\n" \
                +"\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Top-Label"+"\""+","+"\""+findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)+"\""+","+"\n" \
                +"\""+sheet+"\""+","+"\""+sheetformula.cell(column=col, row=row).coordinate+"\""+"," +"\""+"Left-Label"+"\""+","+"\""+findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)+"\""+","+"\n" 
            
            return val
 

    return 0

def getValueEx2(sheetformula,sheetvalue,col,row,sheet):

#Return if Empty
    if(isCellEmpty(sheetformula.cell(column=col, row=row))):
        return 0


    value=str(sheetvalue.cell(column=col, row=row).value)
    formula=str(sheetformula.cell(column=col, row=row).value)
    
    if(isCellNumber(sheetformula.cell(column=col, row=row))):
        val={0,sheetformula.cell(column=col, row=row).coordinate,value, sheet,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)}
        return val
    else:
        if(isCellFormula(sheetformula.cell(column=col, row=row))):
            val={1,sheetformula.cell(column=col, row=row).coordinate,formula,value+findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)} 
            
            return val
 

    return 0

def processWorkBook(path):
    workBook = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path)
    workSheetFormula = workBook.get_active_sheet()
    
    workBookValued = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path,data_only=True)
    workSheetValued = workBookValued.get_active_sheet()

    processedBook = openpyxl.Workbook()
    processedSheet = processedBook.get_sheet_by_name('Sheet')

    hr=workSheetFormula.get_highest_row()
    hc=workSheetFormula.get_highest_column()

    for row in range(1, hr+1):
        for col in range(1, hc+1): 
            _ = processedSheet.cell(column=col, row=row, value=getValue(workSheetFormula,workSheetValued,col,row))


    processedBook.save(settings.PROJECT_ROOT+"/media/documents/pathoutput.xlsx")

    return settings.PROJECT_ROOT+"/media/documents/pathoutput.xlsx"

def processWorkBookAll(path):
    workBook = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path)
    workBookValued = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path,data_only=True)
    workBookSheets=workBook.get_sheet_names()
    
    file = open(settings.PROJECT_ROOT+"/media/documents/newfile.txt", "w")

    for sheet in workBookSheets:
    
        workSheetFormula = workBook.get_sheet_by_name(sheet)
        workSheetValued = workBookValued.get_sheet_by_name(sheet)
        hr=workSheetFormula.get_highest_row()
        hc=workSheetFormula.get_highest_column()
        
        for row in range(1, hr+1):
            for col in range(1, hc+1): 
                val=getValueEx(workSheetFormula,workSheetValued,col,row,sheet)
                if(val!=0):
                    _ = file.write(str(val)+"\n")


    file.close()

    return settings.PROJECT_ROOT+"/media/documents/newfile.txt"


def processWorkBookHdf5(path):
    workBook = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path)
    workBookValued = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path,data_only=True)
    workBookSheets=workBook.get_sheet_names()


    outfile = hdf.File(settings.PROJECT_ROOT+"/media/documents/data.hdf5",'w')
    
    list={}
    
    for sheet in workBookSheets:
    
        workSheetFormula = workBook.get_sheet_by_name(sheet)
        workSheetValued = workBookValued.get_sheet_by_name(sheet)
        hr=workSheetFormula.get_highest_row()
        hc=workSheetFormula.get_highest_column()
        grp_sheet = outfile.create_group(sheet)
        
        count=0;
        for row in range(1, hr+1):
            for col in range(1, hc+1): 
                val=getValueEx(workSheetFormula,workSheetValued,col,row,sheet)
                if(val!=0):
                    count=count+1
                    name=str(count)
                    dset=grp_sheet.create_dataset(name, data=val)
                    

        
    
    outfile.close()
    
    return settings.PROJECT_ROOT+"/media/documents/data.hdf5"

def index(request):

    return HttpResponse("Welcome- Under Construction")


def upload(request):

    # Handle file upload
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            newdoc = ExcelFile(docfile = request.FILES['docfile'])
            newdoc.save()
            file=processWorkBookHdf5(newdoc.docfile.name)
            # Redirect to the document list after POST
            #return HttpResponseRedirect(reverse('tidit.views.upload'))
            path = settings.PROJECT_ROOT+"/media/documents/data.hdf5"
            response = HttpResponse()
            response['X-Sendfile'] = smart_str(path)
            response['Content-Type'] = "data/hdf5"
            response['Content-Length'] = os.stat(path).st_size
            return response
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

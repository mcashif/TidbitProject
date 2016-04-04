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
from django.template import loader
from django.http import Http404, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import mimetypes
from django.http import StreamingHttpResponse


listofdData=[]
sheetList=[]



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
        val=[0,value,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)]
        return val
    else:
        if(isCellFormula(sheetformula.cell(column=col, row=row))):
            val=[1,formula,value,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)]

            return val


    return 0

def getValueEx3(sheetformula,sheetvalue,col,row,sheet):

#Return if Empty
    if(isCellEmpty(sheetformula.cell(column=col, row=row))):
        return 0


    value=str(sheetvalue.cell(column=col, row=row).value)
    formula=str(sheetformula.cell(column=col, row=row).value)

    if(isCellNumber(sheetformula.cell(column=col, row=row))):
        val=[0,value,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)]
        return val
    else:
        if(isCellFormula(sheetformula.cell(column=col, row=row))):
            val=[1,formula,value,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)]

            return val


    return 0

def getValueEx4(sheetformula,sheetvalue,col,row,sheet):

#Return if Empty
    if(isCellEmpty(sheetformula.cell(column=col, row=row))):
        return 0


    value=str(sheetvalue.cell(column=col, row=row).value)
    formula=str(sheetformula.cell(column=col, row=row).value)

    if(isCellNumber(sheetformula.cell(column=col, row=row))):
        val=[0,sheet,sheetformula.cell(column=col, row=row).coordinate,value,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)]
        return val
    else:
        if(isCellFormula(sheetformula.cell(column=col, row=row))):
            val=[1,sheet,sheetformula.cell(column=col, row=row).coordinate,formula,value,findTopVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row),findLeftVaiable(sheetvalue,sheetvalue.cell(column=col, row=row),col,row)]

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

    for sheet in workBookSheets:

        workSheetFormula = workBook.get_sheet_by_name(sheet)
        workSheetValued = workBookValued.get_sheet_by_name(sheet)
        hr=workSheetFormula.get_highest_row()
        hc=workSheetFormula.get_highest_column()
        grp_sheet = outfile.create_group(sheet)

        for row in range(1, hr+1):
            for col in range(1, hc+1):
                val=getValueEx2(workSheetFormula,workSheetValued,col,row,sheet)
                if(val!=0):
                    name=workSheetFormula.cell(column=col, row=row).coordinate
                    fr=name+"/formula"
                    va=name+"/value"
                    tp=name+"/top-label"
                    lf=name+"/left-label"
                    if(val[0]==1):
                        dset=grp_sheet.create_dataset(fr, data=val[1])
                        dset2=grp_sheet.create_dataset(va, data=val[2])
                        dset3=grp_sheet.create_dataset(tp, data=val[3])
                        dset4=grp_sheet.create_dataset(lf, data=val[4])



    outfile.close()

    return settings.PROJECT_ROOT+"/media/documents/data.hdf5"


def processWorkBookHdf5Ex(path):
    workBook = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path)
    workBookValued = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path,data_only=True)
    workBookSheets=workBook.get_sheet_names()

    outfile = hdf.File(settings.PROJECT_ROOT+"/media/documents/data.hdf5",'w')

    for sheet in workBookSheets:

        workSheetFormula = workBook.get_sheet_by_name(sheet)
        workSheetValued = workBookValued.get_sheet_by_name(sheet)
        hr=workSheetFormula.get_highest_row()
        hc=workSheetFormula.get_highest_column()
        grp_sheet = outfile.create_group(sheet)
        fr="formula"
        va="value"
        tp="top-label"
        lf="left-label"
        subgrp=grp_sheet.create_group(fr)
        subgrp1=grp_sheet.create_group(va)
        subgrp2=grp_sheet.create_group(tp)
        subgrp3=grp_sheet.create_group(lf)

        for row in range(1, hr+1):
            for col in range(1, hc+1):
                val=getValueEx2(workSheetFormula,workSheetValued,col,row,sheet)
                if(val!=0):
                    name=workSheetFormula.cell(column=col, row=row).coordinate
                    if(val[0]==1):
                        fr=data=name+":"+val[1]
                        va=data=name+":"+val[2]
                        tp=data=name+":"+val[3]
                        lf=data=name+":"+val[4]
                        dset=subgrp.create_dataset(fr, data=name+":"+val[1])
                        dset=subgrp1.create_dataset(va, data=name+":"+val[2])
                        dset=subgrp2.create_dataset(tp, data=name+":"+val[3])
                        dset=subgrp3.create_dataset(lf, data=name+":"+val[4])



    outfile.close()

    return settings.PROJECT_ROOT+"/media/documents/data.hdf5"


def processWorkBookHdf5Ex2(path):
    workBook = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path)
    workBookValued = openpyxl.load_workbook(settings.PROJECT_ROOT+"/media/"+path,data_only=True)
    workBookSheets=workBook.get_sheet_names()
    listofdData[:] = []
    sheetList[:] = []

    for sheet in workBookSheets:

        workSheetFormula = workBook.get_sheet_by_name(sheet)
        workSheetValued = workBookValued.get_sheet_by_name(sheet)
        hr=workSheetFormula.get_highest_row()
        hc=workSheetFormula.get_highest_column()
        sheetList.append(sheet)

        for row in range(1, hr+1):
            for col in range(1, hc+1):
                val=getValueEx4(workSheetFormula,workSheetValued,col,row,sheet)
                if(val!=0):
                    listofdData.append(val)


    return settings.PROJECT_ROOT+"/media/documents/data.hdf5"

def index(request):

    return render(request, 'tidbit/index.html')

@csrf_exempt
def makeHdfFile(request):

    
    if request.is_ajax() and request.POST:
        
        data = request.POST.get("data")
        jObject = json.loads(data)
        
        outfile = hdf.File(settings.PROJECT_ROOT+"/media/documents/data.hdf5",'w')
        
        fr="formula"
        va="value"
        tp="top-label"
        lf="left-label"
        sheet="non"
        
        g1=0
        g2=0
        g3=0
        g4=0
        
        for jo in jObject:
            
            if(sheet==jo['sheet']):
                fr1=jo['cid']+":"+jo['formula']
                va1=jo['cid']+":"+jo['value']
                tp1=jo['cid']+":"+jo['topLabel']
                lf1=jo['cid']+":"+jo['leftLabel']
                dset=g1.create_dataset(fr1, data=jo['cid']+":"+jo['formula'])
                dset=g2.create_dataset(va1, data=jo['cid']+":"+jo['value'])
                dset=g3.create_dataset(tp1, data=jo['cid']+":"+jo['topLabel'])
                dset=g4.create_dataset(lf1, data=jo['cid']+":"+jo['leftLabel'])  
            
            if(sheet=="non"):
                sheet=jo['sheet']
                grp_sheet = outfile.create_group(sheet)
                g1=grp_sheet.create_group(fr)
                g2=grp_sheet.create_group(va)
                g3=grp_sheet.create_group(tp)
                g4=grp_sheet.create_group(lf)
                fr1=jo['cid']+":"+jo['formula']
                va1=jo['cid']+":"+jo['value']
                tp1=jo['cid']+":"+jo['topLabel']
                lf1=jo['cid']+":"+jo['leftLabel']
                dset=g1.create_dataset(fr1, data=jo['cid']+":"+jo['formula'])
                dset=g2.create_dataset(va1, data=jo['cid']+":"+jo['value'])
                dset=g3.create_dataset(tp1, data=jo['cid']+":"+jo['topLabel'])
                dset=g4.create_dataset(lf1, data=jo['cid']+":"+jo['leftLabel'])
            
            if(sheet!=jo['sheet']):
                sheet=jo['sheet']
                grp_sheet = outfile.create_group(sheet)
                g1=grp_sheet.create_group(fr)
                g2=grp_sheet.create_group(va)
                g3=grp_sheet.create_group(tp)
                g4=grp_sheet.create_group(lf)
                fr1=jo['cid']+":"+jo['formula']
                va1=jo['cid']+":"+jo['value']
                tp1=jo['cid']+":"+jo['topLabel']
                lf1=jo['cid']+":"+jo['leftLabel']
                dset=g1.create_dataset(fr1, data=jo['cid']+":"+jo['formula'])
                dset=g2.create_dataset(va1, data=jo['cid']+":"+jo['value'])
                dset=g3.create_dataset(tp1, data=jo['cid']+":"+jo['topLabel'])
                dset=g4.create_dataset(lf1, data=jo['cid']+":"+jo['leftLabel'])
   
      
                    
   
        outfile.close()
        
        
        filename = settings.PROJECT_ROOT+"/media/documents/data.hdf5"
        response = HttpResponse(content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=%s' % smart_str("data.hdf5")
        response['X-Sendfile'] = smart_str(filename)
        # It's usually a good idea to set the 'Content-Length' header too.
        # You can also set any other required headers: Cache-Control, etc.
        return response
       
    else:
        raise Http404



def upload(request):

    # Handle file upload
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            newdoc = ExcelFile(docfile = request.FILES['docfile'])
            newdoc.save()
            processWorkBookHdf5Ex2(newdoc.docfile.name)
            template = loader.get_template('tidbit/index6.html')
            context = {

                'listofdData': listofdData,
                'sheetList': sheetList,
            }

            return HttpResponse(template.render(context, request))
    else:
        form = DocumentForm() # A empty, unbound form


    # Render list page with the documents and the form
    return render_to_response(
        'tidbit/index6.html',
        {'form': form},
        context_instance=RequestContext(request)
    )

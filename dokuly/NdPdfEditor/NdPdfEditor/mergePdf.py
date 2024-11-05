#----------------------#
# Norsk Datateknikk AS #
#----------------------#

import os, PyPDF2 # packages for pdf merging

def merge_pdf(file1, file2, outputName, rotate = False):
    """[summary]
    :param file1: The file name (no path) for first pages
    :type file1: str
    :param file2: The file name (no path) for additional pages
    :type file2: str
    :param outputName: Name of the resulting merged pdf file
    :type outputName: str
    :param rotate: Decides whether to rotate all pages by 90 deg, defaults to False
    :type rotate: bool, optional
    """

    #Get all the PDF filenames
    pdf2merge = []
    pdf2merge.append(file1)
    pdf2merge.append(file2)

    pdfWriter = PyPDF2.PdfWriter()
    #loop through all PDFs
    for filename in pdf2merge:
        #rb for read binary
        pdfFileObj = open(os.getcwd()+'/'+filename,'rb')
        pdfReader = PyPDF2.PdfReader(pdfFileObj)

        #Opening each page of the PDF
        for pageNum in range(len(pdfReader.pages)):
            pageObj = pdfReader.pages[pageNum]

            if rotate == True:
                pageObj.rotateClockwise(90)

            pdfWriter.add_page(pageObj)

    # Save PDF to file, wb for write binary
    pdfOutput = open(outputName, 'wb')
    #Outputting the PDF
    pdfWriter.write(pdfOutput)
    # Closing the PDF writer
    pdfOutput.close()


def merge_pdf_absolute(file1, file2, outputName, rotate = False):
    """[summary]
    :param file1: Path to the first pages
    :type file1: str
    :param file2: Path to the additional pages
    :type file2: str
    :param outputName: Name of the resulting merged pdf file
    :type outputName: str
    :param rotate: Decides whether to rotate all pages by 90 deg, defaults to False
    :type rotate: bool, optional
    """

    #Get all the PDF filenames
    pdf2merge = []
    pdf2merge.append(file1)
    pdf2merge.append(file2)

    pdfWriter = PyPDF2.PdfWriter()
    #loop through all PDFs
    for filename in pdf2merge:
        #rb for read binary
        pdfFileObj = open(filename,'rb')
        pdfReader = PyPDF2.PdfReader(pdfFileObj)

        #Opening each page of the PDF
        for pageNum in range(len(pdfReader.pages)):
            pageObj = pdfReader.pages[pageNum]

            if rotate == True:
                pageObj.rotateClockwise(90)

            pdfWriter.add_page(pageObj)

    # Save PDF to file, wb for write binary
    pdfOutput = open(outputName, 'wb')
    #Outputting the PDF
    pdfWriter.write(pdfOutput)
    # Closing the PDF writer
    pdfOutput.close()
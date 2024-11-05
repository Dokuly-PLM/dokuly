#----------------------#
# Norsk Datateknikk AS #
#----------------------#

from fpdf import FPDF

import NdPdfEditor.NdPdfEditor.mergePdf

class Editor:
    """PDF generator and editor class.
    """
    from NdPdfEditor.NdPdfEditor.table      import table_row, table_row_dual, revision_table_row, color_row
    from NdPdfEditor.NdPdfEditor.front_page import add_front_page
    from NdPdfEditor.NdPdfEditor.formats    import get_page_width_mm, get_text_width_mm
    from NdPdfEditor.NdPdfEditor.metadata   import set_document_metadata

    def __init__(self, orientation='p', format='A4'):
        """Document editor class constructor

        Args:
            orientation (str, optional): landscape 'l' or portret 'p'. Defaults to 'p'.
            format (str, optional): Page format. Defaults to 'A4'.
        """
        self.format=format
        self.orientation=orientation

        self.fpdf = FPDF(orientation=orientation, format=format, unit='mm') 
        self.fpdf.add_page()

        # Color palette
        self.ND_green = [49, 122, 133]
        self.ND_gray  = [33, 33, 33]

    def construct_document(self):
        """This function sets the class in PDF generation mode. The contents are generated as a new document.

        >>> editor = Editor()
        >>> editor.construct_document()
        >>> assert editor.mode == 'construction'
        """
        self.mode = 'construction'

        # Default margins in MS Word.
        self.fpdf.set_left_margin(25.4)
        self.fpdf.set_right_margin(25.4)
        self.fpdf.set_top_margin(25.4)
        self.fpdf.set_auto_page_break( True, margin = 25.4)

    def edit_document(self):
        """This function sets the class in PDF overlay mode.
        The generated page is expected to be overlayed with one some or all pages of an existing PDF.

        >>> editor = Editor()
        >>> editor.edit_document()
        >>> assert editor.mode == 'edit'
        """
        self.mode = 'edit'

    def build_pdf(self, path):
        """Build the document to a PDF file.
        """
        self.fpdf.output(path,'F')
        


# The below code runs the doctests when calling the file
if __name__ == '__main__':
    import doctest
    print("Running tests..")
    doctest.testmod()

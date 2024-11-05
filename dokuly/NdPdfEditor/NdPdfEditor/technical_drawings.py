#----------------------#
# Norsk Datateknikk AS #
#----------------------#

# Get the current year.
import datetime
import os

ND_green = [49, 122, 133]
ND_gray  = [33, 33, 33]

def add_title_frame( self, logo = True, ipr = True ):
    """ Add a title frame to the schematic.
    """

    self.set_auto_page_break( True, margin = 0.0)
    # Add logo font
    # self.add_font('Yu Gothic Light', '', 'fonts/yugothil.ttf', uni=True)

    if ipr:
        self.add_ipr_foot()

    # Create the title frame
    self.drawing_lower_margin_mm = 23

    # Metadata-table
    tab_text_size   = 8
    tab_row_height  = 4
    num_rows        = 4
    self.set_y(self.page_h_mm-self.drawing_lower_margin_mm-num_rows*tab_row_height)
    tab_width       = self.textwidth/6
    placement_x_mm  = self.page_w_mm-self.page_margin_mm-tab_width

    self.table_row( self.doc_title,   text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm )
    self.table_row_dual( 'Doc. number',      self.doc_id,             text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    self.table_row_dual( 'Version',          self.doc_version,        text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    self.table_row_dual( 'Author',           self.doc_author,         text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    #self.table_row_dual( 'State',            self.doc_state,          text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    #self.table_row_dual( 'Release date',     self.doc_released_date,   text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    #self.table_row_dual( 'Customer',         self.doc_customer,       text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    #self.table_row_dual( 'Project',          self.doc_project,        text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )
    #self.table_row_dual( 'Classification',   self.doc_classification, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, placement_x_mm = placement_x_mm, column_size_ratio = 0.3 )


    try:
        abs_path = os.path.dirname(os.path.abspath(__file__))

        if logo:
            # Insert the ND logo
            img_size = 18
            self.image( abs_path + '/figures/logo_circle.png' , 
                        x = self.page_w_mm-img_size-25,
                        y = self.page_h_mm-img_size-60+(8-num_rows)*tab_row_height,
                        w = img_size)
    except:
        print("Failed applying image to pdf!")


def add_version_table( self ): # TODO
    """ Add a version table to drawing.
    """
    # Create table with version note.
    

def title_frame_metadata( self ):
    """ Method generating a front page.
    """
    self.add_page()
    self.add_title_frame()
    

def add_ipr_foot(self):
        """ Method adding footer with Intellectual Propertiy Rights (IPR).
        """
        currentDateTime = datetime.datetime.now()
        date = currentDateTime.date()
        year = date.strftime("%Y")

        ipr_string = "Copyright © " + year + " NORSK DATATEKNIKK AS.\nOrg. no. 921 864 892"

        #pdf.add_page()
        head_foot_height_mm = 14

        #self.set_y(260)
        self.set_y(self.page_h_mm-head_foot_height_mm)
        self.set_x(16)

        self.set_font('Arial', '', self.text_size)
        #self.set_text_color(220, 50, 50)

        self.multi_cell( w=self.textwidth,
                            h=6, align='t', 
                            txt=ipr_string, 
                            border=0)

def write_output(self, in_path, out_path):
    """ Create the output file.
    The output page is the metadata page applied to every page of the inPath_file
    """
    # Output pdf file

    # pdf output file name.
    try:
        os.mkdir('temp')
    except:
        print('temp exsists')
        
    self.output('temp/page_metadata.pdf','F')

    self.existing_pdf = PdfReader(open(in_path, "rb"))
    self.metadata_pdf = PdfReader(open("temp/page_metadata.pdf", "rb"))
    metadata_page = self.metadata_pdf.pages[0]
    number_of_pages = self.existing_pdf.getNumPages() 

    pages = []

    for i in range(number_of_pages):
        # Add the "watermark" (which is the metadata_pdf pdf) on top of the existing page
        page = self.existing_pdf.pages[i]
        page.mergePage(metadata_page)
        pages.append(page)

    output = PdfWriter()

    for page in pages:
        output.add_page(page)

    # Finally, write "output" to a real file
    output_stream = open(out_path, "wb")
    output.write(output_stream)
    output_stream.close()

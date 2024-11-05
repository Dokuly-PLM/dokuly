#----------------------#
# Norsk Datateknikk AS #
#----------------------#

def value_check( param ):
    """Checks if a param is `None` return a `""` string.
    """
    if param == None:
        return ""
    elif type(param) == int:
        print("Expected string, got int: " + param)
        return ""
    else:
        return param

def add_front_page( self,
                    id,
                    title,
                    state,
                    released_date,
                    classification,
                    customer,
                    project,
                    author,
                    doc_checker,
                    summary,
                    logo_path):
    """Method generating an A4 front page with metadata.
    This method should be called before any other content when creating a document.

    Args:
        id (str): The document ID number.
        title (str): The tile of the document.
        state (str): The state of the document, e.g. 'Released'.
        released_date (str): The release date of the document.
        classification (str): The document classification, e.g. 'Company Internal'.
        customer (str): The customer for which the document is prepared.
        project (str): The project name.
        author (str): The author of the document.
        summary (str): The document summary to be displayed on the front page.

    Example:
    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.construct_document()
    >>> summary = "Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." 
    >>> editor.add_front_page( id='TN100100-1-A', title='Document Title', state='Draft', released_date='N/A', classification='Company Internal', customer='Customer AS', project='100100', author='Employer Employer', summary=summary, logo_path='./figures/logo_circle.png')
    >>> editor.build_pdf('examples/front_page_example.pdf')

    Example:
    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.construct_document()
    >>> summary = "" 
    >>> editor.add_front_page( id='TN100100-1-A', title='Document Title', state='Draft', released_date='N/A', classification='Company Internal', customer='Customer AS', project='100100', author='Employer Employer', summary=summary, logo_path='./figures/logo_circle.png')
    >>> editor.build_pdf('examples/front_page_example_no_summary.pdf')

    Example:
    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.construct_document()
    >>> summary = None 
    >>> editor.add_front_page( id='TN100100-1-A', title='Document Title', state='Draft', released_date='N/A', classification='Company Internal', customer='Customer AS', project='100100', author='Employer Employer', summary=summary, logo_path='./figures/logo_circle.png')
    >>> editor.build_pdf('examples/front_page_example_None_summary.pdf')

    :download:`Example <examples/front_page_example_no_summary.pdf>`
    """

    # A4 size
    page_width_mm=self.get_page_width_mm()
    page_h=297
    page_margin_mm = 15 # right/left page margin.
    textwidth = page_width_mm - 2*page_margin_mm 

    self.fpdf.set_right_margin( page_margin_mm )
    self.fpdf.set_left_margin(  page_margin_mm )

    abspath = logo_path # os.path.join(os.path.dirname(os.path.realpath(__file__)), '../figures/logo_circle.png')
    #logo = pkgutil.get_data(__name__, '../figures/logo_circle.png') # Loads the raw image.

    try:
        img_size = 30
        self.fpdf.image( abspath, 
                         x = page_width_mm/2-img_size/2, 
                         y = 45-img_size/2, 
                         w = img_size)
    except:
        print('Failed adding logo with path: ' + abspath)

    title_offset = 80
    title_size   = 18
    text_size    = 10

    self.fpdf.set_y(title_offset)
    self.fpdf.set_font('Arial', 'B', title_size)
    #self.set_text_color(220, 50, 50)

    
    self.fpdf.multi_cell( w=page_width_mm-2*page_margin_mm, 
                          h=10, align='C', 
                          txt=value_check(title), 
                          border=0)

    self.fpdf.set_line_width(0.4)

    # Line on front page.
    """
    self.fpdf.line( page_margin_mm,        # x1
                    title_offset+22,       # y1
                    page_width_mm-page_margin_mm, # x2
                    title_offset+22)       # y2
    """

    self.fpdf.ln(4)
    self.fpdf.cell( w=page_width_mm-2*page_margin_mm, 
                    h=10.0, 
                    align='C', 
                    txt=value_check(id), 
                    border=0)

    # Summary
    #self.set_draw_color(ND_green[0], ND_green[1], ND_green[2])
    if (type(summary)== str) & (summary != ""):
        text_font = 'Arial' 
        table_width_mm = page_width_mm-2*page_margin_mm
        row_height=5

        self.fpdf.ln(20)

        #self.fpdf.set_x(placement_x_mm)
        #self.fpdf.set_font(text_font, '', text_size)

        #self.color_row(self.ND_green)

        self.fpdf.set_font(text_font, '', text_size)
        self.fpdf.set_fill_color(255, 255, 255)
        self.fpdf.multi_cell( w=table_width_mm, 
                              h=row_height, align='C',
                              txt=value_check(summary),
                              border='TB',
                              fill=True)

        #self.color_row(self.ND_green)

    # Metadata-table
    tab_text_size   = 10
    tab_row_height  = 6
    self.fpdf.set_y(page_h-9.1*tab_row_height-page_margin_mm)
    tab_width = textwidth*0.8
    colum_ratio= 0.5

    #self.color_row(self.ND_green, row_height=tab_row_height, table_width_mm=tab_width, align='center')
    self.table_row_dual( parameter='State',           value=state,          column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )
    if author != "" and author != None:
        self.table_row_dual( parameter='Author',          value=author,         column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )
    if doc_checker != "" and doc_checker != None:
        self.table_row_dual( parameter='Checked',     value=doc_checker,    column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )

    self.table_row_dual( parameter='Project',         value=project,        column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )
    self.table_row_dual( parameter='Customer',        value=customer,       column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )
    if released_date:
        self.table_row_dual( parameter='Date',            value=released_date,   column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )
    self.table_row_dual( parameter='Classification',  value=classification, column_size_ratio=colum_ratio, text_size=tab_text_size, row_height=tab_row_height, table_width_mm=tab_width, align='center' )


# The below code runs the doctests when calling the file
if __name__ == '__main__':
    import doctest
    print("Running tests..")
    doctest.testmod()

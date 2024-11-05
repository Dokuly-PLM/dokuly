#----------------------#
# Norsk Datateknikk AS #
#----------------------#

def get_placement_x_mm(fpdf, align, table_width_mm, placement_x_mm, page_width_mm):
    """Function to unify reused snippet.
    """
    if align=='left':
        placement_x_mm = fpdf.l_margin
    if align=='center':
        placement_x_mm = page_width_mm/2 - table_width_mm/2
    if align=='right':
        placement_x_mm = page_width_mm - table_width_mm-fpdf.r_margin
    else:
        placement_x_mm = placement_x_mm
    return placement_x_mm

def get_table_width(fpdf, table_width_mm, text_width_mm):
    """Function to unify reused snippet.
    """
    if table_width_mm==None:
        table_width_mm = text_width_mm
    return table_width_mm
    

def table_row( self, value, text_size=12, text_font='Arial', table_width_mm=None, row_height=5, placement_x_mm = 0, align=None, border=1  ):
    """Create a single column table row.

    Args:
        value (str): The text in the (value) field.
        text_size (int, optional): Defaults to 12.
        text_font (str, optional): Defaults to 'Arial'.
        table_width_mm (int, optional): Defaults to None, this yields a table of with=textwidth.
        row_height (int, optional): Defaults to 5.
        placement_x_mm (float, optional): Left aligned table placement. Defaults to 0.
        align ([str], optional): The alignment of the table. When a valit value, it overrides placement_x_mm. `left, center, right`. Defaults to None.
        border: the cell border. Exposing of the border setting fpdf.cell boder argument.

    Example:
    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.construct_document()
    >>> editor.table_row( value='Value 1', align='left',   table_width_mm=editor.get_text_width_mm()/2 )
    >>> editor.table_row( value='Value 2', align='center', table_width_mm=editor.get_text_width_mm()/2 )
    >>> editor.table_row( value='Value 3', align='right',  table_width_mm=editor.get_text_width_mm()/2 )
    >>> editor.build_pdf('examples/table_row.pdf')

    :download:`Example <examples/table_row.pdf>`
    """
    if value == None:
        value = ""

    self.fpdf.set_font(text_font, '', text_size)

    table_width_mm = get_table_width(self.fpdf, table_width_mm, self.get_text_width_mm())
    placement_x_mm = get_placement_x_mm(self.fpdf, align, table_width_mm, placement_x_mm, self.get_page_width_mm())

    self.fpdf.set_x(placement_x_mm)
    self.fpdf.set_font(text_font, '', text_size)
    self.fpdf.cell(  w=table_width_mm,
                h=row_height, 
                align='L',
                txt=value,
                border=border,
                fill=False)
    self.fpdf.ln(row_height)

def table_row_dual( self, parameter, value, text_size=12, text_font='Arial', table_width_mm=None, row_height=5, placement_x_mm = 0, align=None, column_size_ratio = 0.5, border="B" ):
    """Create a dual column table row.

    Args:
        parameter (str): The text in the right (parameter) field.
        value (str): The text in the left (value) field.
        text_size (int, optional): Defaults to 12.
        text_font (str, optional): Defaults to 'Arial'.
        table_width_mm (int, optional): Defaults to None, this yields a table of with=textwidth.
        row_height (int, optional): Defaults to 5.
        placement_x_mm (float, optional): Left aligned table placement. Defaults to 0.
        align ([str], optional): The alignment of the table. When a valit value, it overrides placement_x_mm. `left, center, right`. Defaults to None.
        column_size_ratio (float, optional): The ratio between the parameter and value cells. A value of 0.5 yields equal size. Defaults to 0.5.
        border: the cell border. Exposing of the border setting fpdf.cell boder argument.
    
    Example:
    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.construct_document()
    >>> editor.table_row_dual( parameter='Paramter 1', value='value 1', align='left',   table_width_mm=editor.get_text_width_mm()/2 )
    >>> editor.table_row_dual( parameter='Paramter 2', value='value 2', align='center', table_width_mm=editor.get_text_width_mm()/2 )
    >>> editor.table_row_dual( parameter='Paramter 3', value='value 3', align='right',  table_width_mm=editor.get_text_width_mm()/2 )
    >>> editor.build_pdf('examples/table_row_dual.pdf')
    
    :download:`Example <examples/table_row_dual.pdf>`
    """
    if value == None:
        value = ""

    table_width_mm = get_table_width(   self.fpdf, table_width_mm, self.get_text_width_mm())
    placement_x_mm = get_placement_x_mm(self.fpdf, align, table_width_mm, placement_x_mm, self.get_page_width_mm())

    self.fpdf.set_x(placement_x_mm)
    self.fpdf.set_font(text_font, '', text_size)

    parameter_field_width_mm = table_width_mm*column_size_ratio
    value_field_width_mm     = table_width_mm*(1-column_size_ratio)

    self.fpdf.cell(  w=parameter_field_width_mm,
                     h=row_height, 
                     align='L',
                     txt=parameter,
                     border=border,
                     fill=False)

    self.fpdf.set_font(text_font, '', text_size)
    self.fpdf.cell(  w=value_field_width_mm, 
                     h=row_height,
                     align='L',
                     txt=value,
                     border=border,
                     fill=False)
    self.fpdf.ln(row_height)

def color_row( self, color, table_width_mm=None, row_height=5, placement_x_mm = None, align='center' ):
    table_width_mm = get_table_width(self.fpdf, table_width_mm, self.get_text_width_mm())
    placement_x_mm = get_placement_x_mm(self.fpdf, align, table_width_mm, placement_x_mm, self.get_page_width_mm())
    
    self.fpdf.set_x(placement_x_mm)
    self.fpdf.set_fill_color(color[0], color[1], color[2])

    color_row_height = row_height/2
    self.fpdf.cell( w = table_width_mm,
                    h = color_row_height,
                    align = 'L',
                    txt   = '',
                    border= 1,
                    fill  = True)
    self.fpdf.ln(color_row_height)

def revision_table_row( self, revision, rev_notes, rev_author, released_date, text_size=11, text_font='Arial', table_width_mm=None, row_height=5, placement_x_mm = None, align='center' ):
    """Create a single column table row.

    Args:
        revision (str)
        rev_notes (str)
        released_date (str)

    Example:
    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.construct_document()
    >>> notes = "Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." 
    >>> editor.revision_table_row( revision='A', rev_notes=notes, rev_author='Erik Buer', released_date='2021-02-10', table_width_mm=editor.get_text_width_mm() )
    >>> editor.revision_table_row( revision='B', rev_notes=notes, rev_author='Erik Buer', released_date='2021-02-14', table_width_mm=editor.get_text_width_mm() )
    >>> editor.revision_table_row( revision='C', rev_notes=notes, rev_author='Erik Buer', released_date='', table_width_mm=editor.get_text_width_mm() )
    >>> editor.revision_table_row( revision='C', rev_notes=None,  rev_author='Erik Buer', released_date='', table_width_mm=editor.get_text_width_mm() )
    >>> editor.build_pdf('examples/revision_table.pdf')

    :download:`Example <examples/revision_table.pdf>`
    """
    if rev_notes == None:
        rev_notes = ""

    table_width_mm = get_table_width(self.fpdf, table_width_mm, self.get_text_width_mm())
    placement_x_mm = get_placement_x_mm(self.fpdf, align, table_width_mm, placement_x_mm, self.get_page_width_mm())


    self.fpdf.set_fill_color(self.ND_green[0],self.ND_green[1], self.ND_green[2])

    self.fpdf.set_x(placement_x_mm)
    self.fpdf.set_font(text_font, '', text_size)

    # self.color_row(self.ND_green)

    self.table_row_dual( parameter='Revision',        value=revision,     text_size=text_size, align=align, table_width_mm=table_width_mm, column_size_ratio = 0.25, border='TLR' )
    self.table_row_dual( parameter='Release Date',    value=released_date, text_size=text_size, align=align, table_width_mm=table_width_mm, column_size_ratio = 0.25, border='LR' )
    self.table_row_dual( parameter='Revision Author', value=rev_author,   text_size=text_size, align=align, table_width_mm=table_width_mm, column_size_ratio = 0.25, border='LR' )
    
    self.fpdf.set_font(text_font, '', text_size*0.9)
    self.fpdf.multi_cell( w=table_width_mm,
                          h=row_height, 
                          align='L',
                          txt=rev_notes,
                          border=1,
                          fill=False)
    

# The below code runs the doctests when calling the file
if __name__ == '__main__':
    import doctest
    print("Running tests..")
    doctest.testmod()

#----------------------#
# Norsk Datateknikk AS #
#----------------------#

import datetime

def add_ipr_foot( self,
                  company,
                  org_num_str):
    """ Method adding footer with Intellectual Propertiy Rights (IPR).
    :download:`Example <examples/ipr_a4.pdf>`.
    """
    currentDateTime = datetime.datetime.now()
    date = currentDateTime.date()
    year = date.strftime("%Y")

    ipr_string = "Copyright © " + year + " " + company +" .\nOrg. no. " + org_num_str

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
#----------------------#
# Norsk Datateknikk AS #
#----------------------#

def set_document_metadata( self ):
    """ Adding metadata to the pdf file.
    """
    self.pypdf.set_author(self.doc_author)
    self.pypdf.set_title(self.doc_title)
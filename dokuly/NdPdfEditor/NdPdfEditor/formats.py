#----------------------#
# Norsk Datateknikk AS #
#----------------------#

class PaperFormat:
    A4 = (210,297)
    A3 = (297,420)


def get_page_width_mm(self):
    """Get the page width for a certain paper format.
    Returns:
        int: the paper width in mm.

    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.get_page_width_mm()
    210
    """
    if self.format=='A4':
        if self.orientation=='p':
            return PaperFormat.A4[0]
        elif self.orientation=='l':
            return PaperFormat.A4[1]
        else:
            return None
    elif self.format=='A3':
        if self.orientation=='p':
            return PaperFormat.A3[0]
        elif self.orientation=='l':
            return PaperFormat.A3[1]
        else:
            return None

def get_text_width_mm(self):
    """Get the text width for a certain paper format.
    Returns:
        int: the text width in mm.

    >>> from editor import Editor
    >>> editor = Editor(orientation='p', format='A4')
    >>> editor.get_text_width_mm()
    189.9975
    """
    return self.get_page_width_mm()-self.fpdf.l_margin-self.fpdf.r_margin

# The below code runs the doctests when calling the file
if __name__ == '__main__':
    import doctest
    doctest.testmod()

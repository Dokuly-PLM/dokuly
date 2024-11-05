def createBomArrays (obj, asm_ids_new, asm_mpns_new, part_ids_new, part_mpns_new, pcba_ids_new, pcba_mpns_new):
    """Create BOM data arrays for multiple bom entries.

    :param obj: A BOM entry
    :type obj: dict
    :param asm_ids_new: A list of asm ids to be saved
    :type obj: [dict]
    :param part_ids_new: A list of part ids to be saved
    :type obj: [dict]
    :param pcba_ids_new: A list of pcba ids to be saved
    :type obj: [dict]
    :param asm_mpns_new: A list of asm info to be saved
    :type obj: [str]
    :param part_mpns_new: A list of part info to be saved
    :type obj: [str]
    :param pcba_mpns_new: A list of pcba info to be saved
    :type obj: [str]
    :return: All data arrays needed for a bom entity.
    :rtype: [dict], [dict], [dict], [dict], [dict], [dict]

    ## Example
    >>> bom_object1 = {'id': 1,'refdes': 1,'mpn': None,'quantity': 1,'dnm': 'No','type': "ASM"}
    >>> bom_object2 = {'id': 2,'refdes': 2,'mpn': 124124,'quantity': 3,'dnm': 'Yes','type': "PRT", 'stagedQuantity': 5}
    >>> stateBom = [bom_object1, bom_object2]
    >>> asmIds = []
    >>> asmMpns = []
    >>> prtIds = []
    >>> prtMpns = []
    >>> pcbIds = []
    >>> pcbMpns = []
    >>> for obj in stateBom:
    ...     asmIds,asmMpns,prtIds,prtMpns,pcbIds,pcbMpns = createBomArrays(obj, asmIds, asmMpns, prtIds, prtMpns, pcbIds, pcbMpns)
    >>> print(asmIds,asmMpns,prtIds,prtMpns,pcbIds,pcbMpns)
    [1] ['1,1,404-NotFound,No,1'] [2] ['2,2,124124,Yes,5'] [] []
    """
    if obj['type'] == "ASM": # Add ids to new arrays
        asm_ids_new.append(obj['id'])
        # Create and add the mpn JSON string to mpn array
        refdes = ""
        if 'refdes' in obj:
            refdes = obj['refdes']
        mpn = ""
        if 'mpn' in obj:
            mpn = obj['mpn']
            if mpn == None or mpn == "":
                mpn = "404-NotFound"
        dnm = ""
        if 'dnm' in obj:
            dnm = obj['dnm']
        quantity = 1
        if 'quantity' in obj:
            quantity = obj['quantity']
        if 'stagedQuantity' in obj:
            quantity = obj['stagedQuantity']
        asm_mpns_new.append(str(obj['id']) + "," + str(refdes) + "," + str(mpn) + "," + str(dnm) + "," + str(quantity))
    elif obj['type'] == "PRT":
        part_ids_new.append(obj['id'])
        refdes = ""
        if 'refdes' in obj:
            refdes = obj['refdes']
        mpn = ""
        if 'mpn' in obj:
            mpn = obj['mpn']
            if mpn == None or mpn == "":
                mpn = "404-NotFound"
        dnm = ""
        if 'dnm' in obj:
            dnm = obj['dnm']
        quantity = 1
        if 'quantity' in obj:
            quantity = obj['quantity']
        if 'stagedQuantity' in obj:
            quantity = obj['stagedQuantity']
        part_mpns_new.append(str(obj['id']) + "," + str(refdes) + "," + str(mpn) + "," + str(dnm) + "," + str(quantity))
    else:
        pcba_ids_new.append(obj['id'])
        refdes = ""
        if 'refdes' in obj:
            refdes = obj['refdes']
        mpn = ""
        if 'mpn' in obj:
            mpn = obj['mpn']
            if mpn == None or mpn == "":
                mpn = "404-NotFound"
        dnm = ""
        if 'dnm' in obj:
            dnm = obj['dnm']
        quantity = 1
        if 'quantity' in obj:
            quantity = obj['quantity']
        if 'stagedQuantity' in obj:
            quantity = obj['stagedQuantity']
        pcba_mpns_new.append(str(obj['id']) + "," + str(refdes) + "," + str(mpn) + "," + str(dnm) + "," + str(quantity))
    return asm_ids_new, asm_mpns_new, part_ids_new, part_mpns_new, pcba_ids_new, pcba_mpns_new

if __name__ == "__main__":
    import doctest
    doctest.testmod(raise_on_error=True)
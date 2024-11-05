
export const pcbaCheck = (pcba, nodes) => {
    let flag = false
    let index = -1
    for(let i = 0; i < nodes.length; i++) {
        if(nodes[i].data != null && nodes[i].data != undefined) {
            let check = parseInt(nodes[i].data.pcba_part_number) == parseInt(pcba.part_number) ? true : false
            if(check) {
                flag = true
                index = i
                break
            }
        }
    }
    if(flag != true) {
        let notFound = {
            'status': false, 'indexBom' : index , 'bomEntry' : pcba
        }
        return notFound
    }
    let found = {
        'status': true, 'indexBom' : index , 'bomEntry' : pcba
    }
    return found
}
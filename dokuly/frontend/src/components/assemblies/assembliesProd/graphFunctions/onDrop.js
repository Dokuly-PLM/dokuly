import React from 'react'

const onDrop = (event, elements, flowWrapper, reactFlowInstance) => {

    event.preventDefault();
    const flowBounds = flowWrapper.current.getBoundingClientRect();
    const serialNum = event.dataTransfer.getData('reactflowData');
    const nodeId = event.dataTransfer.getData('id')
    const next_prod = event.dataTransfer.getData('next_prod')
    const prev_prod = event.dataTransfer.getData('prev_prod')
    const revision = event.dataTransfer.getData('revision')
    const comment = event.dataTransfer.getData('comment')
    const assembly_date = event.dataTransfer.getData('assembly_data')
    const state = event.dataTransfer.getData('state')
    const pcba_part_number = event.dataTransfer.getData('pcba_part_number')

    let duplicateFlag = false

    elements.map((production, index) => {
        if(nodeId == production.id) {
            duplicateFlag = true
        }
    })

    if(duplicateFlag) {
        return null
    }

    const position = reactFlowInstance.project({
        x: event.clientX - flowBounds.left,
        y: event.clientY - flowBounds.top,
    })
    
    const node = {
        id: nodeId,
        position,
        data:{
            label: 
                <div>
                    {serialNum}{" - "}{pcba_part_number}
                </div>, 
                id: nodeId, assembly_date: assembly_date, comment: comment, next_prod: next_prod,
                prev_prod: prev_prod, revision: revision, serial_number: serialNum, state: state, pcba_part_number: pcba_part_number
            
        }
    }
    return node
}

export default onDrop
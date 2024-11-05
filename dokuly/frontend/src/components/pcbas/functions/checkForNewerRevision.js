import React from 'react'

export const CheckForNewerRevision = (currentRevision, currentPN, pcbas) => {
    let pcbasDetailed = []
    pcbas.map((pcba) => {
        if(pcba.part_number == currentPN) {
            pcbasDetailed.push(pcba)
        }
    })

    if(pcbasDetailed?.length != 0) {
        for(let i = 0; i < pcbasDetailed.length; i++) {
            if(pcbasDetailed[i].revision > currentRevision) {
                return false
            }
        }
    }
    return true
}


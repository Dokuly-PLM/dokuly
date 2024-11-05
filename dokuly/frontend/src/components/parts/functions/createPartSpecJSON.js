

export const createPartSpecJSON = (capacitance, 
    dielectric, dissFactor, insulRes, maxTemp, minTemp, packaging, schedule, termination,
    tolerance, voltage, vr, vrDC ) => {
    
    let newSpecs = []

    if(capacitance !== "")  {
        let e1 = {
            'attribute' : {
                'name' : "Capacitance",
                'group' : "Technical",
                'shortname' : "capacitance"
            },
            'display_value': capacitance
        }
        newSpecs.push(e1)
    }
    if(dielectric !== "") {
        let e2 = {
            'attribute' : {
                'name' : "Dielectric",
                'group' : "Technical",
                'shortname' : "dielectric"
            },
            'display_value': dielectric
        }
        newSpecs.push(e2)
    }
    if(dissFactor !== "") {
        let e3 = {
            'attribute' : {
                'name' : "Dissipation Factor",
                'group' : "Technical",
                'shortname' : "dissipationfactor"
            },
            'display_value': dissFactor
        }
        newSpecs.push(e3)
    }
    if(insulRes !== "") {
        let e4 = {
            'attribute' : {
                'name' : "Insulation Resistance",
                'group' : "Technical",
                'shortname' : "insulationresistance"
            },
            'display_value': insulRes
        }
        newSpecs.push(e4)
    }
    if(maxTemp !== "") {
        let e5 = {
            'attribute' : {
                'name' : "Max Operating Temperature",
                'group' : "Technical",
                'shortname' : "maxoperatingtemperature"
            },
            'display_value': maxTemp
        }
        newSpecs.push(e5)
    }
    if(minTemp !== "") {
        let e6 = {
            'attribute' : {
                'name' : "Min Operating Temperature",
                'group' : "Technical",
                'shortname' : "minoperatingtemperature"
            },
            'display_value': minTemp
        }
        newSpecs.push(e6)
    }
    if(packaging !== "") {
        let e7 = {
            'attribute' : {
                'name' : "Packaging",
                'group' : "Technical",
                'shortname' : "packaging"
            },
            'display_value': packaging
        }
        newSpecs.push(e7)
    }
    if(packaging !== "") {
        let e8 = {
            'attribute' : {
                'name' : "Schedule B",
                'group' : "Technical",
                'shortname' : "scheduleB"
            },
            'display_value': schedule
        }
        newSpecs.push(e8)
    }
    if(termination !== "") {
        let e9 = {
            'attribute' : {
                'name' : "Termination",
                'group' : "Technical",
                'shortname' : "termination"
            },
            'display_value': termination
        }
        newSpecs.push(e9)
    }
    if(tolerance !== "") {
        let e10 = {
            'attribute' : {
                'name' : "Tolerance",
                'group' : "Technical",
                'shortname' : "tolerance"
            },
            'display_value': tolerance
        }
        newSpecs.push(e10)
    }
    if(voltage !== "") {
        let e11 = {
            'attribute' : {
                'name' : "Voltage",
                'group' : "Technical",
                'shortname' : "voltage"
            },
            'display_value': voltage
        }
        newSpecs.push(e11)
    }
    if(vr !== "") {
        let e12 = {
            'attribute' : {
                'name' : "Voltage Rating",
                'group' : "Technical",
                'shortname' : "voltagerating"
            },
            'display_value': vr
        }
        newSpecs.push(e12)
    }
    if(vrDC !== "") {
        let e13 = {
            'attribute' : {
                'name' : "Voltage Rating (DC)",
                'group' : "Technical",
                'shortname' : "voltagerating_dc_"
            },
            'display_value': vrDC
        }
        newSpecs.push(e13)
    }
    return newSpecs

}
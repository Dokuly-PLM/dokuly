
export const specsEditLoadValues = (specs) => {
    let cap = ""
    let di = ""
    let diss = ""
    let insul = ""
    let max = ""
    let min = ""
    let pack = ""
    let sche = ""
    let termin = ""
    let toler = ""
    let volt = ""
    let voltR = ""
    let voltRdc = ""

    specs.map((spec) => {
        if(spec.attribute.name == "Capacitance") {
            cap = spec.display_value
        } else if(spec.attribute.name == "Dielectric") {
            di = spec.display_value
        } else if(spec.attribute.name == "Dissipation Factor") {
            diss = spec.display_value
        } else if(spec.attribute.name == "Insulation Resistance") {
            insul = spec.display_value
        } else if(spec.attribute.name == "Max Operating Temperature") {
            max = spec.display_value
        } else if(spec.attribute.name == "Min Operating Temperature") {
            min = spec.display_value
        } else if(spec.attribute.name == "Packaging") {
            pack = spec.display_value
        } else if(spec.attribute.name == "Schedule B") {
            sche = spec.display_value
        } else if(spec.attribute.name == "Termination") {
            termin = spec.display_value
        } else if(spec.attribute.name == "Tolerance") {
            toler = spec.display_value
        } else if(spec.attribute.name == "Voltage") {
            volt = spec.display_value
        } else if(spec.attribute.name == "Voltage Rating") {
            voltR = spec.display_value
        } else {
            voltRdc = spec.display_value
        }
    })

    return {
        cap: cap,
        di: di,
        diss: diss,
        insul: insul,
        max: max,
        min: min,
        pack: pack,
        sche: sche,
        termin: termin,
        toler: toler,
        volt: volt,
        voltR: voltR,
        voltRdc: voltRdc,
    }
}
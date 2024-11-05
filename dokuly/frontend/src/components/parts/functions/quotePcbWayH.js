import axios from "axios";

export const quotePcbWayH = (pcb_length, pcb_width, price_qty) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("api-key", ""); // Add your PCBWay API key here

    var raw =
      '{\n	"Country": "",\n' + // Add your country here
      '"CountryCode": "",\n' + // Add your country code here
      '"ShipType": 1,\n' + // Add your shipping type here
      '"Postalcode": "",\n' + // Add your postal code here
      '"City": "",\n' + // Add your city here
      '"Length": ' +
      pcb_length +
      ",\n" +
      '"Width": ' +
      pcb_width +
      ",\n" +
      '"Layers": ' +
      4 +
      ",\n" +
      '"Qty": ' +
      price_qty +
      ",\n" +
      '"Thickness": 1.6,\n' +
      '"Material": "FR-4",\n' +
      '"DesignInPanel": 1,\n' +
      '"MinTrackSpacing": "4/4mil",\n' +
      '"MinHoleSize": 0.2,\n' +
      '"SolderMask": "White",\n' +
      '"Silkscreen": "Black",\n' +
      '"SurfaceFinish": "Immersion gold",\n' +
      '"ViaProcess": "Tenting vias",\n' +
      '"FinishedCopper": "1 oz Cu",\n' +
      '"FR4Tg": "TG130",\n' +
      '"Goldfingers": "No",\n}';

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const promise = fetch(
      corsServerAddress + "http://api-partner.pcbway.com/api/Pcb/PcbQuotation",
      requestOptions
    )

    const textPromise = promise.then((res) => res.text())
    const dataPromise = textPromise.then((res) => res)
    const error = textPromise.catch((err) => err)
    if(error != null) {
      return error
    }
    return dataPromise
}
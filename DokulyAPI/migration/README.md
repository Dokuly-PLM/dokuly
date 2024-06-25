# Example for extracting parts and documents from a ZIP file
This example assumes that the ZIP file contains a directory structure like:
- Part1 Solar Reflector/
  - Document 1.doc
  - part_image.png
  - more_files/
    - stepfile.step
    - Document.doc
- Part2-Test Part
- Part4 TX Antenna
- Part101-U-bolt/
  - Document 3.doc
  - stepfile.step
- Part3030 RX Antenna/
  - Document 4.docx

---

Each top folder in the ZIP will be the resulting part. The name must be on the format:
- (Prefix)(Part Number) (Display Name)
- (Prefix)(Part Number)-(Display Name)

Valid Syntax:
- PRT3 Test Name -> Prefix = PRT, Part Number = 3, Display Name = Test Name
- DK321-Test Name -> Prefix = DK, Part Number = 321, Display Name = Test Name

All .doc* files found will be marked and processed as documents. Other files like .step, .png, .zip, .pdf, etc. will be added to the parts as attachments (part files).

The resulting parts format after running batch process parts on Part Migration Example.zip:

```JSON
{
    "parts": [
        {
            "name": "Part1 Solar Reflector",
            "displayName": "Solar Reflector",
            "partNumber": "1",
            "partPrefix": "Part",
            "partFiles": [
                {
                    "fileName": "Part Migration Example\\Part1 Solar Reflector\\part_image.PNG",
                    "displayName": "part_image.PNG"
                },
                {
                    "fileName": "Part Migration Example\\Part1 Solar Reflector\\some_other_file.txt",
                    "displayName": "some_other_file.txt"
                },
                {
                    "fileName": "Part Migration Example\\Part1 Solar Reflector\\Some part files\\part_file.txt",
                    "displayName": "part_file.txt"
                },
                {
                    "fileName": "Part Migration Example\\Part1 Solar Reflector\\Some part files\\stepfile.step",
                    "displayName": "stepfile.step"
                }
            ]
        },
        {
            "name": "Part101-U bolt",
            "displayName": "U bolt",
            "partNumber": "101",
            "partPrefix": "Part",
            "partFiles": [
                {
                    "fileName": "Part Migration Example\\Part101-U bolt\\part_image.PNG",
                    "displayName": "part_image.PNG"
                },
                {
                    "fileName": "Part Migration Example\\Part101-U bolt\\some_other_file.txt",
                    "displayName": "some_other_file.txt"
                }
            ]
        },
        {
            "name": "Part2-Test Part",
            "displayName": "Test part",
            "partNumber": "2",
            "partPrefix": "Part",
            "partFiles": [
                {
                    "fileName": "Part Migration Example\\Part2-Test Part\\part_image.PNG",
                    "displayName": "part_image.PNG"
                },
                {
                    "fileName": "Part Migration Example\\Part2-Test Part\\some_other_file.txt",
                    "displayName": "some_other_file.txt"
                }
            ]
        },
        {
            "name": "Part3030 RX Antenna",
            "displayName": "RX Antenna",
            "partNumber": "3030",
            "partPrefix": "Part",
            "partFiles": [
                {
                    "fileName": "Part Migration Example\\Part3030 RX Antenna\\part_image.PNG",
                    "displayName": "part_image.PNG"
                },
                {
                    "fileName": "Part Migration Example\\Part3030 RX Antenna\\some_other_file.txt",
                    "displayName": "some_other_file.txt"
                },
                {
                    "fileName": "Part Migration Example\\Part3030 RX Antenna\\Some part files\\part_file.txt",
                    "displayName": "part_file.txt"
                },
                {
                    "fileName": "Part Migration Example\\Part3030 RX Antenna\\Some part files\\stepfile.step",
                    "displayName": "stepfile.step"
                },
                {
                    "fileName": "Part Migration Example\\Part3030 RX Antenna\\Some part files\\More files\\part_file.txt",
                    "displayName": "part_file.txt"
                },
                {
                    "fileName": "Part Migration Example\\Part3030 RX Antenna\\Some part files\\More files\\stepfile.step",
                    "displayName": "stepfile.step"
                }
            ]
        },
        {
            "name": "Part4 TX Antenna",
            "displayName": "TX Antenna",
            "partNumber": "4",
            "partPrefix": "Part",
            "partFiles": [
                {
                    "fileName": "Part Migration Example\\Part4 TX Antenna\\part_image.PNG",
                    "displayName": "part_image.PNG"
                },
                {
                    "fileName": "Part Migration Example\\Part4 TX Antenna\\some_other_file.txt",
                    "displayName": "some_other_file.txt"
                }
            ]
        }
    ]
}
```

The resulting documents format after running batch process part on Part Migration Example.zip:
```JSON
{
    "documents" : [
        {
            "fileName": "Part Migration Example\\Part1 Solar Reflector\\part_document.docx",
            "fileSize": 18661,
            "displayName": "part_document.docx",
            "partNumber": "1"
        },
        {
            "fileName": "Part Migration Example\\Part101-U bolt\\part_document.docx",
            "fileSize": 18661,
            "displayName": "part_document.docx",
            "partNumber": "101"
        },
        {
            "fileName": "Part Migration Example\\Part2-Test Part\\part_document.docx",
            "fileSize": 18661,
            "displayName": "part_document.docx",
            "partNumber": "2"
        },
        {
            "fileName": "Part Migration Example\\Part3030 RX Antenna\\part_document.docx",
            "fileSize": 18661,
            "displayName": "part_document.docx",
            "partNumber": "3030"
        },
        {
            "fileName": "Part Migration Example\\Part4 TX Antenna\\part_document.docx",
            "fileSize": 18661,
            "displayName": "part_document.docx",
            "partNumber": "4"
        }
    ]
}
```
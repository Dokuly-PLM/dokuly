/**
 * @brief converts: R1, R2, R5, R7, R8, R9, RES1 into R1-R2, R5, R7-R9, RES1
 */
function compressConventionalArray(conventionalArray) {
  try {
    const compressedArray = [];
    let start = conventionalArray[0];
    let end = start;

    for (let i =  1; i < conventionalArray.length; i++) {
      const current = conventionalArray[i];
      const regex = /^([A-Za-z]+)([0-9]+)$/;
      const matchCurrent = current.match(regex);
      const matchEnd = end.match(regex);

      if (matchCurrent && matchEnd && matchCurrent[1] === matchEnd[1] && parseInt(matchCurrent[2],  10) === parseInt(matchEnd[2],  10) +  1) {
        end = current;
      } else {
        if (start === end) {
          compressedArray.push(start);
        } else {
          compressedArray.push(`${start}-${end}`);
        }
        start = current;
        end = current;
      }
    }

    // Push the last sequence
    if (start === end) {
      compressedArray.push(start);
    } else {
      compressedArray.push(`${start}-${end}`);
    }

    return compressedArray;
  } catch (error) {
    console.error("Error in compressConventionalArray:", error);
    return conventionalArray;
  }
}

/**
 * @brief converts: R1A, R1C, R1D, R1E, RES12E into R1A, R1C-R1E, RES12E
 */
function compressLetterEndingArray(letterEndingArray) {
  try {
    const compressedArray = [];
    let start = letterEndingArray[0];
    let end = start;

    for (let i =  1; i < letterEndingArray.length; i++) {
      const current = letterEndingArray[i];
      const regex = /^([A-Za-z]+)([0-9]+)([A-Za-z]+)$/;
      const matchCurrent = current.match(regex);
      const matchEnd = end.match(regex);

      if (matchCurrent && matchEnd && matchCurrent[1] === matchEnd[1] && matchCurrent[2] === matchEnd[2] && matchCurrent[3].charCodeAt(0) === matchEnd[3].charCodeAt(0) +  1) {
        end = current;
      } else {
        if (start === end) {
          compressedArray.push(start);
        } else {
          compressedArray.push(`${start}-${end}`);
        }
        start = current;
        end = current;
      }
    }

    // Push the last sequence
    if (start === end) {
      compressedArray.push(start);
    } else {
      compressedArray.push(`${start}-${end}`);
    }

    return compressedArray;
  } catch (error) {
    console.error("Error in compressLetterEndingArray:", error);
    return letterEndingArray;
  }
}


function compressNumberOnlyArray(numberOnlyArray) {
  try {
    const compressedArray = [];
    let start = numberOnlyArray[0];
    let end = start;

    for (let i =  1; i < numberOnlyArray.length; i++) {
      const current = numberOnlyArray[i];
      if (parseInt(current,  10) === parseInt(end,  10) +  1) {
        end = current;
      } else {
        if (start === end) {
          compressedArray.push(start);
        } else {
          compressedArray.push(`${start}-${end}`);
        }
        start = current;
        end = current;
      }
    }

    // Push the last sequence
    if (start === end) {
      compressedArray.push(start);
    } else {
      compressedArray.push(`${start}-${end}`);
    }

    return compressedArray;
  } catch (error) {
    console.error("Error in compressNumberOnlyArray:", error);
    return numberOnlyArray;
  }
}


/**
 * @brief converts: "A", "B", "C", "E", "F", "G", "H" into "A-C", "E-H"
 */
function compressLetterOnlyArray(letterOnlyArray) {
  try {
    const compressedArray = [];
    let start = letterOnlyArray[0];
    let end = start;

    for (let i =  1; i < letterOnlyArray.length; i++) {
      const current = letterOnlyArray[i];
      if (current.charCodeAt(0) === end.charCodeAt(0) +  1) {
        end = current;
      } else {
        if (start === end) {
          compressedArray.push(start);
        } else {
          compressedArray.push(`${start}-${end}`);
        }
        start = current;
        end = current;
      }
    }

    // Push the last sequence
    if (start === end) {
      compressedArray.push(start);
    } else {
      compressedArray.push(`${start}-${end}`);
    }

    return compressedArray;
  } catch (error) {
    console.error("Error in compressLetterOnlyArray:", error);
    return letterOnlyArray;
  }
}


export const referenceDesignatorFormatter = (referenceDesignatorString) => {
  try {
    // Split the input string into an array, remove spaces, and sort
    const refDesArray = referenceDesignatorString.replace(/\s+/g, "").split(",").sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

    const conventionalDesignatorArray = [];   // R1, R2, R5, R7, R8, R9, RES1
    const letterEndingDesignatorArray = [];   // R1A, R1C, R1D, RES12E
    const numberOnlyDesignatorArray = [];     // 1, 2, 3, 4, 6, 7, 8, 10
    const letterOnlyDesignatorArray = [];     // A, B, C, E, F, G, H
    const othersArray = [];                   // Others


    // Regular expressions to identify formats
    const conventionalRegex = /^[A-Za-z]+[0-9]+$/;
    const letterEndingRegex = /^[A-Za-z]+[0-9]+[A-Za-z]+$/;
    const numberOnlyRegex = /^[0-9]+$/;
    const letterOnlyRegex = /^[A-Za-z]+$/;

    refDesArray.forEach(refDes => {
      if (conventionalRegex.test(refDes)) {
        conventionalDesignatorArray.push(refDes);
      } else if (letterEndingRegex.test(refDes)) {
        letterEndingDesignatorArray.push(refDes);
      } else if (numberOnlyRegex.test(refDes)) {
        numberOnlyDesignatorArray.push(refDes);
      } else if (letterOnlyRegex.test(refDes)) {
        letterOnlyDesignatorArray.push(refDes);
      } else {
        othersArray.push(refDes);
      }
    });

    const compressedConventionalArray = compressConventionalArray(conventionalDesignatorArray);
    const compressedLetterEndingArray = compressLetterEndingArray(letterEndingDesignatorArray);
    const compressedNumberOnlyArray = compressNumberOnlyArray(numberOnlyDesignatorArray);
    const compressedLetterOnlyArray = compressLetterOnlyArray(letterOnlyDesignatorArray);
    
    const filteredCompressedConventionalArray = compressedConventionalArray.filter(item => item);
    const filteredCompressedLetterEndingArray = compressedLetterEndingArray.filter(item => item);
    const filteredCompressedNumberOnlyArray = compressedNumberOnlyArray.filter(item => item);
    const filteredCompressedLetterOnlyArray = compressedLetterOnlyArray.filter(item => item);
    const filteredOthersArray = othersArray.filter(item => item);

    const formattedArray = filteredCompressedConventionalArray.concat(filteredCompressedLetterEndingArray, filteredCompressedNumberOnlyArray, filteredCompressedLetterOnlyArray, filteredOthersArray);

    return formattedArray.join(", ");
  } catch (error) {
    console.error("Error in referenceDesignatorFormatter:", error);
    return referenceDesignatorString;
  }
};

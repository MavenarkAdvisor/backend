const { response } = require("express");
const xlsx = require("xlsx");
const Cashflow = require("./model/cashflowModel");

exports.readExcelFile = async (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};

// ------------------------------------------------------------------------
// // initial DF=1.00
// exports.DF = async () => {
//     const prevDF = data[index - 1]?.DF
//     const data = prevDF / Math.pow((1 + testYTM), (prevDate - date) / dcb);
//     return dcb === "" ? 0 : data;
//   };

// // ------------------------------------------------------------------------

// exports.PV = Total * DF;

// ------------------------------------------------------------------------
const testYTM = 0.01;

const InitialYTMDifferential = 0.01;

const InitialYTM = data[index - 1]?.prevEndYTM; //from 2nd row

// ------------------------------------------------------------------------

exports.YTMDifferential = async () => {
  if (prevChangeInDifference === "NA") {
    return prevYTMDifferential / 2;
  } else if (Math.abs(RequiredChangeInDiff / SumOfTotal) > 1) {
    return InitialYTMDifferential;
  } else if (Math.abs(prevChangeInDifference) < 0.1) {
    return prevYTMDifferential / 10;
  } else {
    return system_date > prevDate ? system_date : prevDate;
  }
};

// ------------------------------------------------------------------------

exports.AdjustedYTMDifferential =
  YTMDifferential * (OldDifference < 0 ? -1 : 1);

// ------------------------------------------------------------------------

exports.ModifiedYTM = InitialYTM + AdjustedYTMDifferential;

// ----------------------------------------------------------------

exports.YTMcalculate = async (item) => {
  const subSecCode = item.SubSecCode;
  const extractedValue = parseFloat(subSecCode.split("_")[1]).toFixed(2) + "%";
  return extractedValue;
};

const { xirr } = require("node-irr");

const calculateIRR = (cashFlows) => {
  try {
    const result = xirr(cashFlows);
    return result; // Return the result instead of logging it
  } catch (error) {
    console.error("Error calculating IRR:", error.message);
    return null; // Return null in case of an error
  }
};

exports.calculateYTM = async (item, index, data, currentDate) => {
  const cashFlows = data
    .filter((obj) => obj.SecurityCode === item.SecurityCode)
    .map((obj) => {
      return {
        date: new Date((obj.Date - 25569) * 86400 * 1000),
        amount: parseFloat(obj.Total),
        days: obj.DCB,
      };
    });
  // console.log(cashFlows);
  return calculateIRR(cashFlows).rate * 1000;
};

exports.calculatePrevCFDate = async (item, index, data, currentDate) => {
  if (index === 0) {
    return ""; // No previous CF date for the first item
  }

  const prevDate = new Date((data[index - 1].Date - 25569) * 86400 * 1000);
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);
  const currentDateObj = new Date(currentDate); // Convert current date to Date object
  const principal = item.Principal; // Get the Principal of the current item

  // Check if D3 < 0 or B3 <= $B$2

  if (principal < 0 || currentRowDate <= currentDateObj) {
    return "";
  }
  // Otherwise, calculate the Prev CF Date as MAX($B$2, B2)
  return prevDate > currentDateObj ? prevDate : currentDateObj;
};

exports.calculateDF = async (item, index, data) => {
  if (item.StartDate == "") {
    return parseFloat(1).toFixed(16);
  }

  const prevDF = data[index - 1]?.DF ? data[index - 1].DF : 1.0;
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);
  const daysToPrevCF =
    (currentRowDate - item.StartDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days

  const DF = prevDF / Math.pow(1 + item.YTM, daysToPrevCF / item.DCB);
  return DF;
};

exports.calculateRecordDate = async (item) => {
  if (item.Total < 0) {
    return "";
  }
  const interestType = item["RDType"];
  const date = new Date((item.Date - 25569) * 86400 * 1000);
  const daysOffset = item["RDDays"];

  if (interestType === "Business") {
    return ""; // Return empty string if Interest is less than 0
  }

  if (interestType === "Business") {
    // Calculate Record Date using WORKDAY function for Business type
    // const recordDate = new Date(date);
    // recordDate.setDate(recordDate.getDate() - daysOffset);
    const recordDate = subtractWorkdays(recordDate, daysOffset);
    console(recordDate);
    return recordDate;
  } else {
    // Calculate Record Date for Calendar type
    const recordDate = new Date(date);
    recordDate.setDate(recordDate.getDate() - daysOffset);
    return recordDate;
  }
};

exports.calculateWeightage = async (calculatedData) => {
  const weightageMap = {};

  // Calculate the sum of PV for each SubSecCode
  calculatedData.forEach((item) => {
    if (item.PVForValuation !== "") {
      weightageMap[item.SubSecCode] =
        (weightageMap[item.SubSecCode] || 0) + item.PVForValuation;
    }
  });

  // Calculate Weightage for each item
  calculatedData.forEach((item) => {
    const sumPV = weightageMap[item.SubSecCode] || 0;
    item.Weightage =
      item.PVForValuation === "" || sumPV === 0
        ? ""
        : (item.PVForValuation / sumPV) * 100 + "%";
  });

  return calculatedData;
};

exports.calculateYrs = async (item, index, data) => {
  if (!item.Weightage) {
    return 0;
  }
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);
  const prevCFDate = item.PrevCfDate;
  const daysDiff = (currentRowDate - prevCFDate) / (1000 * 60 * 60 * 24); // Convert milliseconds to days
  const yrs = index === 0 ? 0 : data[index - 1].Yrs; // Get the previous Yrs value or 0 if it's the first item

  return parseFloat(yrs) + daysDiff / item.DCB; // Calculate Yrs
};

exports.calculateDuration = async (item) => {
  if (item.Yrs == "0.00") {
    return "";
  } else {
    const Weightage = parseFloat(item.Weightage) / 100;
    return (Weightage * item.Yrs).toString().slice(0, 4); // Calculate duration
  }
};

exports.secCode = async (item) => {
  const subSecCode = item.SubSecCode;
  const extractedValue = subSecCode.split("_")[0];
  return extractedValue;
};

exports.faceValue = async (cashflowData, item) => {
  if (!cashflowData) {
    console.log("Cashflow data is not available.");
    return 0;
  }
  // Extract criteria values from the item
  const subSecCode = item.SubSecCode;
  const valuationDate = item.ValuationDate;

  // Filter cashflowData based on criteria
  const filteredData = cashflowData.filter(
    (entry) =>
      entry.SubSecCode == subSecCode && // Matches SubSecCode
      entry.Date > valuationDate && // Date is greater than ValuationDate
      parseFloat(entry.Principal.replace(/,/g, "")) > 0 // Principal greater than 0
  );

  const data = cashflowData.filter(
    (entryKey) =>
      entry.subSecCode == subSecCode &&
      entry.Date > valuationDate &&
      parseFloat(entry.principal.replace(/,/g, ""))
  );

  // Calculate the sum of principal payments from the filtered data
  let sum = 0;
  filteredData.forEach((entry) => {
    sum += parseFloat(entry.Principal.replace(/,/g, ""));
  });

  return sum;
};

// Function to find the LIP Date using XLOOKUP logic
exports.findLIPDate = async (cashflowData, item) => {
  const lookupKey = item.SubSecCode + item.SystemDate;

  // Search for the lookupKey in cashflows array
  for (let i = 2; i >= 0; i--) {
    const entry = cashflowData[i];
    const entryKey = entry.SubSecCode + entry.Date;

    // If the lookupKey matches, return the corresponding Date
    if (entryKey === lookupKey) {
      return entry.Date;
    }
  }

  // If no match is found, return null or appropriate value
  return null;
};

// Function to find the NIP Date using XLOOKUP logic
exports.findNIPDate = async (cashflowData, item) => {
  // Convert the date to a number and add 1 to it
  const nextDate = item.SystemDate ? item.SystemDate + 1 : null;

  // If the date is not a number, return null
  if (nextDate === null) {
    return null;
  }

  const lookupKey = item.SubSecCode + nextDate;

  // Search for the lookupKey in cashflows array
  for (let i = 0; i < cashflowData.length; i++) {
    const entry = cashflowData[i];
    const entryKey = entry.SubSecCode + entry.Date;

    // If the lookupKey matches, return the corresponding Date
    if (entryKey === lookupKey) {
      return entry.Date;
    }
  }

  // If no match is found, return null or appropriate value
  return null;
};

// Function to find the Record Date using XLOOKUP logic
exports.findRecordDate = async (cashflowData, item) => {
  // Convert the date to a number and add 1 to it
  const nextDate = item.SystemDate ? item.SystemDate + 1 : null;

  // If the date is not a number, return null
  if (nextDate === null) {
    return null;
  }

  const lookupKey = item.subSecCode + nextDate;

  // Search for the lookupKey in cashflows array
  for (let i = 0; i < cashflowData.length; i++) {
    const entry = cashflowData[i];
    const entryKey = entry.SubSecCode + entry.Date;

    // If the lookupKey matches, return the corresponding RecordDate
    if (entryKey === lookupKey) {
      return entry.RecordDate;
    }
  }

  // If no match is found, return null or appropriate value
  return null;
};

// exports.calculateSystemDate = async (item) =>{
//     if (eod_pricemaster === true) {
//       systemDate.setDate(systemDate.getDate() + 1);
//     }
//     return(systemDate.getTime());
// }
exports.calculatePriceMaster = async (item) => {
  if (eod_priceMaster === ture) {
    systemDate.setDate(systemDate.getDate() + 1);
  }
  return systemDate.getTime();
};

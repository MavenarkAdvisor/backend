const { response } = require("express");
const xlsx = require("xlsx");
const Cashflow = require("./model/cashflowModel");

exports.readExcelFile = async (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
};

// -------------------------------------------------------------

exports.joinDataArrays = (array1, array2, property) => {
  const joinedData = [];
  for (let item1 of array1) {
    for (let item2 of array2) {
      if (item1[property] === item2[property]) {
        joinedData.push({ ...item1, ...item2 });
      }
    }
  }
  return joinedData;
};

exports.excelToJSDate = (serial) => new Date((serial - 25569) * 86400 * 1000);
exports.JSToExcelDate = (newdate) => {
  const date = new Date(newdate);
  return Math.floor(date.getTime() / 86400 / 1000) + 25569;
};

exports.getValueOrEmpty = (value) => (!value ? "" : value);

exports.calculateDFForValuation = async (item, index, data, system_date) => {
  if (item.PrevCfDate == "") {
    return parseFloat(1).toFixed(16);
  }

  const prevDFForValuation = data[index - 1]?.DFForValuation
    ? data[index - 1].DFForValuation
    : 1.0;

  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);
  const YTM = parseFloat(item.YTM);
  const daysToPrevCF =
    (currentRowDate - item.StartDateForValue) / (1000 * 60 * 60 * 24); // Convert milliseconds to days

  if (item.Total < 0 || system_date > currentRowDate) {
    return 1.0;
  } else {
    return prevDFForValuation / Math.pow(1 + YTM, daysToPrevCF / item.DCB);
  }
};

exports.calculatePVForValuation = async (item, system_date) => {
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);

  const valueDate = new Date(system_date);
  valueDate.setDate(valueDate.getDate() - 1);

  if (item.Total < 0 || valueDate > currentRowDate) {
    return "";
  } else {
    return parseFloat(item.Total) * parseFloat(item.DFForValuation);
  }
};

exports.calculatePV = async (item, system_date) => {
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);

  const valueDate = new Date(system_date);
  valueDate.setDate(valueDate.getDate() - 1);

  if (item.Total < 0 || valueDate > currentRowDate) {
    return "";
  } else {
    return parseFloat(item.Total) * parseFloat(item.DFForValuation);
  }
};

exports.calculateTenor = async (item, index, calculatedData, system_date) => {
  // Calculate Weightage for each item

  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);
  const currRowStartDate = calculatedData[index]?.StartDateForValue
    ? new Date(calculatedData[index].StartDateForValue)
    : 1;

  const valueDate = new Date(system_date);
  valueDate.setDate(valueDate.getDate() - 1);

  const prevTenor = calculatedData[index - 1]?.Tenor
    ? calculatedData[index - 1].Tenor
    : 0.0;

  const daysDiff = (currentRowDate - currRowStartDate) / (1000 * 60 * 60 * 24);

  if (item.Total < 0 || valueDate > currentRowDate) {
    return 0.0;
  } else {
    return prevTenor + daysDiff / item.DCB;
  }
};

exports.calculateMacaulayDuration = async (item) => {
  return item.Weightage === ""
    ? ""
    : (parseFloat(item.Weightage.split("%")[0]) * item.Tenor) / 100;
};

const isWeekday = (date) => {
  const day = date.getDay();
  // Sunday (0) and Saturday (6) are not weekdays
  return day !== 0 && day !== 6;
};

const subtractWorkdays = (date, daysToSubtract) => {
  let currentDate = new Date(date);
  let workdaysCount = 0;

  while (workdaysCount < daysToSubtract) {
    // Move to the previous day
    currentDate.setDate(currentDate.getDate() - 1);

    // Check if the new date is a weekday
    if (isWeekday(currentDate)) {
      workdaysCount++;
    }
  }

  return currentDate;
};

exports.calculateRecordDateModify = async (item) => {
  if (item.Total < 0) {
    return "";
  }
  const interestType = item["RDType"];
  const date = new Date((item.Date - 25569) * 86400 * 1000);
  const daysOffset = item["RDDays"];

  if (interestType === "") {
    return ""; // Return empty string if Interest is less than 0
  }

  if (interestType === "Business") {
    // Calculate Record Date using WORKDAY function for Business type
    const recordDate = subtractWorkdays(date, daysOffset);
    return recordDate;
  } else {
    // Calculate Record Date for Calendar type
    const recordDate = new Date(date);
    recordDate.setDate(recordDate.getDate() - daysOffset);
    return recordDate;
  }
};

exports.calculateStartDate = async (item, index, data, system_date) => {
  if (index === 0) {
    return "";
  }

  const prevDate = data[index - 1]?.Date
    ? new Date((data[index - 1].Date - 25569) * 86400 * 1000)
    : 1;
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);

  const valueDate = new Date(system_date);
  valueDate.setDate(valueDate.getDate() - 1);

  if (item.Total < 0 || currentRowDate <= system_date) {
    return "";
  } else {
    return system_date > prevDate ? system_date : prevDate;
  }
};

exports.calculateStartDateForValue = async (item, index, data, system_date) => {
  if (index === 0) {
    return "";
  }

  const prevDate = data[index - 1]?.Date
    ? new Date((data[index - 1].Date - 25569) * 86400 * 1000)
    : 1;
  const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);

  const valueDate = new Date(system_date);
  valueDate.setDate(valueDate.getDate() - 1);

  if (item.Total < 0 || currentRowDate <= valueDate) {
    return "";
  } else {
    return system_date > prevDate ? system_date : prevDate;
  }
};

exports.calculatePVMOdify = async (item, index, data, system_date) => {
  // if (item.StartDate === "") {
  //   return "";
  // }

  // const currentRowDate = new Date((item.Date - 25569) * 86400 * 1000);

  // const valueDate = new Date(system_date);
  // valueDate.setDate(valueDate.getDate() - 1);

  // if (item.Total < 0 || system_date > currentRowDate) {
  //   return "";
  // } else {
  //   return parseFloat(item.Total) * parseFloat(item.DF);
  // }

  // const a = !item.StartDate ? "" : item.Total * item.DF;

  // return a ? (system_date > item.RecordDate ? a - item.Total : a) : "";

  try {
    let a;
    if (!item.StartDate) {
      return "";
    } else {
      a = item.Total * item.DF;
    }

    let result;
    if (system_date > item.RecordDate) {
      result = a - item.Total;
    } else {
      result = a;
    }

    return result;
  } catch (error) {
    return "";
  }
};

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

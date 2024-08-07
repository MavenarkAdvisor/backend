// require("dotenv").config();
// const express = require("express");
// const multer = require("multer");
// const utils = require("./utils");
// const xlsx = require("xlsx");
// const app = express();
// const path = require("path");
// const fs = require("fs");
// const cors = require("cors");
// const connectDB = require("./config/connectMongo");
// const cashflowModel = require("./model/cashflowModel");
// const secDetailModel = require("./model/secDetailModel");
// const redemptionModel = require("./model/redemptionModel");
// const subsecinfoModel = require("./model/subsecinfoModel");
// const systemDateModel = require("./model/systemDateModel");
// // const transactionModel = require("./model/transactionModel");
// // const secInfoModel = require("./model/secInfoModel");

// // Enable CORS for all requests
// app.use(cors());
// app.use(express.json());

// // Set up multer for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// // Connect to MongoDB
// connectDB();

// app.post("/download", async (req, res) => {
//   try {
//     let { from, to } = req.body;
//     from = new Date(from);
//     to = new Date(to);

//     console.log(from, to);

//     const result = await subsecinfoModel.find(
//       {
//         SystemDate: {
//           $gte: from,
//           $lte: to,
//         },
//       },
//       {
//         _id: 0,
//         __v: 0,
//         createdAt: 0,
//         updatedAt: 0,
//       }
//     );

//     const cleanResult = result.map((doc) =>
//       doc.toObject({ getters: true, virtuals: false })
//     );

//     if (cleanResult && !cleanResult.length) {
//       return res.status(404).json({ status: false });
//     }

//     res.json({ status: true, data: cleanResult });
//   } catch (error) {
//     res.status(500).json({ status: false, message: error.message });
//   }

//   // const newWorkbook = xlsx.utils.book_new();
//   // const newWorksheet = xlsx.utils.json_to_sheet(cleanResult);
//   // xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

//   // Save the new workbook
//   // const outputPath = path.join("uploads", "output.xlsx");
//   // xlsx.writeFile(newWorkbook, outputPath);

//   // res.download(outputPath, "output.xlsx", (err) => {
//   //   if (err) {
//   //     return res.status(500).json({ error: "Failed to download file" });
//   //   }
//   //   // Clean up the uploaded file and the generated Excel file after download
//   //   fs.unlink(outputPath, () => {});
//   // });
// });

// app.post(
//   "/subsecinfo",
//   upload.fields([
//     { name: "file1", maxCount: 1 },
//     { name: "file2", maxCount: 1 },
//     { name: "file3", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     try {
//       let { system_date, from, to } = req.body;
//       system_date = new Date(system_date);
//       from = new Date(from);
//       to = new Date(to);

//       const valueDate = new Date(system_date);
//       valueDate.setDate(valueDate.getDate() - 1);

//       const file1 = req.files["file1"][0];
//       const file2 = req.files["file2"][0];
//       const file3 = req.files["file3"][0];

//       const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
//       const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
//       const data1 = xlsx.utils.sheet_to_json(sheet1);

//       const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
//       const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
//       const data2 = xlsx.utils.sheet_to_json(sheet2);

//       const workbook3 = xlsx.read(file3.buffer, { type: "buffer" });
//       const sheet3 = workbook3.Sheets[workbook3.SheetNames[0]];
//       const stockmaster = xlsx.utils.sheet_to_json(sheet3);

//       const data = utils.joinDataArrays(data1, data2, "SecurityCode");

//       console.log("System Date", system_date);

//       for (let index = 0; index < stockmaster.length; index++) {
//         const item = stockmaster[index];

//         let {
//           ClientCode,
//           ClientName,
//           EventType,
//           TradeDate,
//           SettlementDate,
//           SecurityCode,
//           Quantity,
//           Rate,
//           InterestPerUnit,
//           StampDuty,
//         } = item;

//         TradeDate = utils.excelToJSDate(TradeDate);
//         stockmaster[index].TradeDate = TradeDate;

//         SettlementDate = utils.excelToJSDate(SettlementDate);
//         stockmaster[index].SettlementDate = SettlementDate;

//         let YTM = 0.0;

//         if (new Date(system_date) >= new Date(SettlementDate)) {
//           const prevYTMobj = stockmaster.find(
//             (obj) => SecurityCode === obj.SecurityCode && obj.YTM
//           );

//           if (prevYTMobj) {
//             YTM = prevYTMobj.YTM;
//           } else {
//             let filterarray = data.filter(
//               (obj) =>
//                 obj.SecurityCode === SecurityCode &&
//                 utils.excelToJSDate(obj.Date) > SettlementDate
//             );
//             if (InterestPerUnit < 0) {
//               filterarray = filterarray.slice(1);
//             }

//             const maparray = filterarray.map((obj) => {
//               return {
//                 Date: utils.excelToJSDate(obj.Date),
//                 Total: obj.Total,
//                 DCB: obj.DCB,
//               };
//             });

//             let ytmarray = [
//               {
//                 Date: SettlementDate,
//                 Total: (Rate + InterestPerUnit) * -1,
//                 DF: 1.0,
//               },
//               ...maparray,
//             ];

//             let ytmvalues = [{ InitialYTM: 0.01, YTMdifferential: 0.01 }];

//             let defaultInitialYTM = 0.01;
//             let defaultYTMdifferential = 0.01;
//             let i = 0;
//             do {
//               const InitialYTM = defaultInitialYTM;

//               ytmvalues[i].InitialYTM = InitialYTM;

//               const YTMdifferential = defaultYTMdifferential;

//               ytmvalues[i].YTMdifferential = YTMdifferential;

//               for (let index = 0; index < ytmarray.length; index++) {
//                 const item = ytmarray[index];

//                 if (index > 0) {
//                   const dayDiff =
//                     (ytmarray[index].Date - ytmarray[index - 1].Date) /
//                     (1000 * 60 * 60 * 24);
//                   ytmarray[index].DF =
//                     item.DCB === ""
//                       ? 0
//                       : ytmarray[index - 1].DF /
//                         Math.pow(1 + InitialYTM, dayDiff / item.DCB);
//                 }

//                 ytmarray[index].PV = ytmarray[index].Total * ytmarray[index].DF;
//               }

//               const OldDifference = ytmarray.reduce(
//                 (accumulator, currentobj) => accumulator + currentobj.PV,
//                 0
//               );

//               ytmvalues[i].OldDifference = parseFloat(OldDifference.toFixed(2));

//               const AdjustedYTMDifferential =
//                 OldDifference < 0
//                   ? ytmvalues[i].YTMdifferential * -1
//                   : ytmvalues[i].YTMdifferential;
//               ytmvalues[i].AdjustedYTMDifferential = AdjustedYTMDifferential;

//               ytmvalues[i].ModifiedYTM =
//                 ytmvalues[i].InitialYTM + ytmvalues[i].AdjustedYTMDifferential;

//               const ModifiedYTM = ytmvalues[i].ModifiedYTM;

//               for (let index = 0; index < ytmarray.length; index++) {
//                 const item = ytmarray[index];

//                 if (index > 0) {
//                   const dayDiff =
//                     (ytmarray[index].Date - ytmarray[index - 1].Date) /
//                     (1000 * 60 * 60 * 24);

//                   ytmarray[index].DF =
//                     item.DCB === ""
//                       ? 0
//                       : ytmarray[index - 1].DF /
//                         Math.pow(1 + ModifiedYTM, dayDiff / item.DCB);
//                 }

//                 ytmarray[index].PV = ytmarray[index].Total * ytmarray[index].DF;
//               }

//               const NewDifference = ytmarray.reduce(
//                 (accumulator, currentobj) => accumulator + currentobj.PV,
//                 0
//               );

//               ytmvalues[i].NewDifference = parseFloat(NewDifference.toFixed(2));

//               const ChangeInYTM =
//                 OldDifference > 0 === NewDifference > 0
//                   ? ModifiedYTM - InitialYTM
//                   : "NA";

//               ytmvalues[i].ChangeInYTM = ChangeInYTM;

//               const ChangeInDiff =
//                 ChangeInYTM === "NA" ? "NA" : NewDifference - OldDifference;

//               ytmvalues[i].ChangeInDiff = ChangeInDiff;

//               const RequiredChangeInDiff =
//                 ChangeInYTM === "NA" ? "NA" : OldDifference * -1;

//               ytmvalues[i].RequiredChangeInDiff = RequiredChangeInDiff;

//               const RequiredChangeYTM =
//                 ChangeInYTM === "NA"
//                   ? "NA"
//                   : isNaN(ChangeInDiff) || ChangeInDiff === 0
//                   ? 0
//                   : (ChangeInYTM * RequiredChangeInDiff) / ChangeInDiff;

//               ytmvalues[i].RequiredChangeYTM = RequiredChangeYTM;

//               const EndYTMv1 = ChangeInDiff === 0 ? ModifiedYTM : InitialYTM;
//               const EndYTMv2 =
//                 RequiredChangeYTM === "NA"
//                   ? InitialYTM
//                   : InitialYTM + RequiredChangeYTM;
//               const EndYTM = Math.max(EndYTMv1, EndYTMv2, -99.9999);

//               ytmvalues[i].EndYTM = EndYTM;

//               defaultInitialYTM = EndYTM;

//               const SumOfTotal = ytmarray.reduce(
//                 (accumulator, currentobj) => accumulator + currentobj.Total,
//                 0
//               );
//               if (ChangeInDiff === "NA") {
//                 defaultYTMdifferential = YTMdifferential / 2;
//               } else if (Math.abs(RequiredChangeInDiff / SumOfTotal) > 1) {
//                 defaultYTMdifferential = YTMdifferential;
//               } else if (Math.abs(ChangeInDiff) < 0.1) {
//                 defaultYTMdifferential = YTMdifferential;
//               } else {
//                 defaultYTMdifferential = YTMdifferential / 10;
//               }

//               ytmvalues.push({ InitialYTM: EndYTM });

//               i++;
//             } while (
//               ytmvalues[i - 1].OldDifference > 0 ||
//               ytmvalues[i - 1].NewDifference > 0 ||
//               ytmvalues[i - 1].OldDifference < 0 ||
//               ytmvalues[i - 1].NewDifference < 0
//             );

//             if (ytmvalues[i - 1].OldDifference <= 0) {
//               YTM = ytmvalues[i - 1].InitialYTM;
//             } else if (ytmvalues[i - 1].NewDifference <= 0) {
//               YTM = ytmvalues[i - 1].ModifiedYTM;
//             }
//           }
//         }
//         stockmaster[index].YTM = YTM;

//         const SucuritySubCode = SecurityCode + "_" + (YTM * 100).toFixed(2);
//         stockmaster[index].SucuritySubCode = SucuritySubCode;
//       }

//       // const stockmaster = await Promise.all(
//       //   stockmaster.map(async (item, index) => {
//       //     let {
//       //       ClientCode,
//       //       ClientName,
//       //       EventType,
//       //       TradeDate,
//       //       SettlementDate,
//       //       SecurityCode,
//       //       Quantity,
//       //       Rate,
//       //       InterestPerUnit,
//       //       StampDuty,
//       //     } = item;

//       //     TradeDate = utils.excelToJSDate(TradeDate);
//       //     SettlementDate = utils.excelToJSDate(SettlementDate);

//       //     let YTM = 0.0;

//       //     console.log(
//       //       new Date(system_date).toString() >=
//       //         new Date(SettlementDate).toString()
//       //     );
//       //     if (
//       //       new Date(system_date).toString() >=
//       //       new Date(SettlementDate).toString()
//       //     ) {
//       //       const prevYTMobj = stockmaster.find(
//       //         (obj) => SecurityCode === obj.SecurityCode && obj.YTM
//       //       );

//       //       if (prevYTMobj) {
//       //         YTM = prevYTMobj.YTM;
//       //       } else {
//       //         let filterarray = data.filter(
//       //           (obj) =>
//       //             obj.SecurityCode === SecurityCode &&
//       //             utils.excelToJSDate(obj.Date) > SettlementDate
//       //         );
//       //         if (InterestPerUnit < 0) {
//       //           filterarray = filterarray.slice(1);
//       //         }

//       //         const maparray = filterarray.map((obj) => {
//       //           return {
//       //             Date: utils.excelToJSDate(obj.Date),
//       //             Total: obj.Total,
//       //             DCB: obj.DCB,
//       //           };
//       //         });

//       //         let ytmarray = [
//       //           {
//       //             Date: SettlementDate,
//       //             Total: (Rate + InterestPerUnit) * -1,
//       //             DF: 1.0,
//       //           },
//       //           ...maparray,
//       //         ];

//       //         let ytmvalues = [{ InitialYTM: 0.01, YTMdifferential: 0.01 }];

//       //         let defaultInitialYTM = 0.01;
//       //         let defaultYTMdifferential = 0.01;
//       //         let i = 0;
//       //         do {
//       //           const InitialYTM = defaultInitialYTM;

//       //           ytmvalues[i].InitialYTM = InitialYTM;

//       //           const YTMdifferential = defaultYTMdifferential;

//       //           ytmvalues[i].YTMdifferential = YTMdifferential;

//       //           for (let index = 0; index < ytmarray.length; index++) {
//       //             const item = ytmarray[index];

//       //             if (index > 0) {
//       //               const dayDiff =
//       //                 (ytmarray[index].Date - ytmarray[index - 1].Date) /
//       //                 (1000 * 60 * 60 * 24);
//       //               ytmarray[index].DF =
//       //                 item.DCB === ""
//       //                   ? 0
//       //                   : ytmarray[index - 1].DF /
//       //                     Math.pow(1 + InitialYTM, dayDiff / item.DCB);
//       //             }

//       //             ytmarray[index].PV =
//       //               ytmarray[index].Total * ytmarray[index].DF;
//       //           }

//       //           const OldDifference = ytmarray.reduce(
//       //             (accumulator, currentobj) => accumulator + currentobj.PV,
//       //             0
//       //           );

//       //           ytmvalues[i].OldDifference = parseFloat(
//       //             OldDifference.toFixed(2)
//       //           );

//       //           const AdjustedYTMDifferential =
//       //             OldDifference < 0
//       //               ? ytmvalues[i].YTMdifferential * -1
//       //               : ytmvalues[i].YTMdifferential;
//       //           ytmvalues[i].AdjustedYTMDifferential = AdjustedYTMDifferential;

//       //           ytmvalues[i].ModifiedYTM =
//       //             ytmvalues[i].InitialYTM +
//       //             ytmvalues[i].AdjustedYTMDifferential;

//       //           const ModifiedYTM = ytmvalues[i].ModifiedYTM;

//       //           for (let index = 0; index < ytmarray.length; index++) {
//       //             const item = ytmarray[index];

//       //             if (index > 0) {
//       //               const dayDiff =
//       //                 (ytmarray[index].Date - ytmarray[index - 1].Date) /
//       //                 (1000 * 60 * 60 * 24);

//       //               ytmarray[index].DF =
//       //                 item.DCB === ""
//       //                   ? 0
//       //                   : ytmarray[index - 1].DF /
//       //                     Math.pow(1 + ModifiedYTM, dayDiff / item.DCB);
//       //             }

//       //             ytmarray[index].PV =
//       //               ytmarray[index].Total * ytmarray[index].DF;
//       //           }

//       //           const NewDifference = ytmarray.reduce(
//       //             (accumulator, currentobj) => accumulator + currentobj.PV,
//       //             0
//       //           );

//       //           ytmvalues[i].NewDifference = parseFloat(
//       //             NewDifference.toFixed(2)
//       //           );

//       //           const ChangeInYTM =
//       //             OldDifference > 0 === NewDifference > 0
//       //               ? ModifiedYTM - InitialYTM
//       //               : "NA";

//       //           ytmvalues[i].ChangeInYTM = ChangeInYTM;

//       //           const ChangeInDiff =
//       //             ChangeInYTM === "NA" ? "NA" : NewDifference - OldDifference;

//       //           ytmvalues[i].ChangeInDiff = ChangeInDiff;

//       //           const RequiredChangeInDiff =
//       //             ChangeInYTM === "NA" ? "NA" : OldDifference * -1;

//       //           ytmvalues[i].RequiredChangeInDiff = RequiredChangeInDiff;

//       //           const RequiredChangeYTM =
//       //             ChangeInYTM === "NA"
//       //               ? "NA"
//       //               : isNaN(ChangeInDiff) || ChangeInDiff === 0
//       //               ? 0
//       //               : (ChangeInYTM * RequiredChangeInDiff) / ChangeInDiff;

//       //           ytmvalues[i].RequiredChangeYTM = RequiredChangeYTM;

//       //           const EndYTMv1 = ChangeInDiff === 0 ? ModifiedYTM : InitialYTM;
//       //           const EndYTMv2 =
//       //             RequiredChangeYTM === "NA"
//       //               ? InitialYTM
//       //               : InitialYTM + RequiredChangeYTM;
//       //           const EndYTM = Math.max(EndYTMv1, EndYTMv2, -99.9999);

//       //           ytmvalues[i].EndYTM = EndYTM;

//       //           defaultInitialYTM = EndYTM;

//       //           const SumOfTotal = ytmarray.reduce(
//       //             (accumulator, currentobj) => accumulator + currentobj.Total,
//       //             0
//       //           );
//       //           if (ChangeInDiff === "NA") {
//       //             defaultYTMdifferential = YTMdifferential / 2;
//       //           } else if (Math.abs(RequiredChangeInDiff / SumOfTotal) > 1) {
//       //             defaultYTMdifferential = YTMdifferential;
//       //           } else if (Math.abs(ChangeInDiff) < 0.1) {
//       //             defaultYTMdifferential = YTMdifferential;
//       //           } else {
//       //             defaultYTMdifferential = YTMdifferential / 10;
//       //           }

//       //           ytmvalues.push({ InitialYTM: EndYTM });

//       //           i++;
//       //         } while (
//       //           ytmvalues[i - 1].OldDifference > 0 ||
//       //           ytmvalues[i - 1].NewDifference > 0 ||
//       //           ytmvalues[i - 1].OldDifference < 0 ||
//       //           ytmvalues[i - 1].NewDifference < 0
//       //         );

//       //         if (ytmvalues[i - 1].OldDifference <= 0) {
//       //           YTM = ytmvalues[i - 1].InitialYTM;
//       //         } else if (ytmvalues[i - 1].NewDifference <= 0) {
//       //           YTM = ytmvalues[i - 1].ModifiedYTM;
//       //         }
//       //       }
//       //     }

//       //     const SucuritySubCode = SecurityCode + "_" + (YTM * 100).toFixed(2);

//       //     return {
//       //       ClientCode,
//       //       ClientName,
//       //       EventType,
//       //       TradeDate,
//       //       SettlementDate,
//       //       SecurityCode,
//       //       Quantity,
//       //       Rate,
//       //       InterestPerUnit,
//       //       StampDuty,
//       //       YTM,
//       //       SucuritySubCode,
//       //     };
//       //   })
//       // );

//       // return res.json({
//       //   status: true,
//       //   stockmaster: stockmaster,
//       //   subsecinfo: stockmaster,
//       // });

//       // return res.json({ status: true, data: stockmaster });

//       const calculatedData = await Promise.all(
//         data
//           .filter(
//             (item) =>
//               stockmaster.find(
//                 (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
//               ) && utils.excelToJSDate(item.Date) >= system_date
//           )
//           .map(async (item, index) => {
//             const ytmvalues = stockmaster.filter(
//               (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
//             );
//             const YTM = ytmvalues && ytmvalues.length ? ytmvalues[0].YTM : 0.0;

//             // const YTM = await utils.calculateYTM(item, index, data, system_date);

//             const SubSecCode = item.SecurityCode + "_" + (YTM * 100).toFixed(2);

//             const Interest = item.Interest;

//             const Principal = item.Principal;

//             const Total = item.Total;

//             return {
//               ...item,
//               YTM,
//               SubSecCode,
//               Interest,
//               Principal,
//               Total,
//             };
//           })
//       );

//       for (let index = 0; index < calculatedData.length; index++) {
//         const item = calculatedData[index];

//         const prevCFDate = await utils.calculatePrevCFDate(
//           item,
//           index,
//           calculatedData,
//           system_date
//         );
//         calculatedData[index].prevCFDate = prevCFDate;

//         const StartDateForValue = await utils.calculateStartDateForValue(
//           item,
//           index,
//           calculatedData,
//           system_date
//         );
//         calculatedData[index].StartDateForValue = StartDateForValue;
//       }

//       // Calculate DF
//       for (let index = 0; index < calculatedData.length; index++) {
//         const item = calculatedData[index];

//         const StartDate = await utils.calculateStartDate(
//           item,
//           index,
//           calculatedData,
//           system_date
//         );
//         calculatedData[index].StartDate = StartDate;

//         const DF = await utils.calculateDF(item, index, calculatedData);
//         calculatedData[index].DF = parseFloat(DF).toFixed(16);

//         const DFForValuation = await utils.calculateDFForValuation(
//           item,
//           index,
//           calculatedData,
//           system_date
//         );
//         calculatedData[index].DFForValuation =
//           parseFloat(DFForValuation).toFixed(16);

//         const PVForValuation = await utils.calculatePVForValuation(
//           item,
//           system_date
//         );
//         calculatedData[index].PVForValuation = PVForValuation;

//         const PV = await utils.calculatePVMOdify(
//           item,
//           index,
//           calculatedData,
//           system_date
//         );
//         calculatedData[index].PV = PV;
//       }

//       await utils.calculateWeightage(calculatedData); // calculating weightage

//       for (let index = 0; index < calculatedData.length; index++) {
//         const item = calculatedData[index];

//         const Tenor = await utils.calculateTenor(
//           item,
//           index,
//           calculatedData,
//           system_date
//         );
//         calculatedData[index].Tenor = Tenor;

//         const MacaulayDuration = await utils.calculateMacaulayDuration(item);
//         calculatedData[index].MacaulayDuration = MacaulayDuration;

//         if (MacaulayDuration === "") {
//           calculatedData[index].RDDays = "";
//           calculatedData[index].RDType = "";
//         }

//         const recordDate = await utils.calculateRecordDateModify(item);
//         calculatedData[index].RecordDate = recordDate;
//       }

//       for (let index = 0; index < calculatedData.length; index++) {
//         const item = calculatedData[index];
//       }

//       const redemption = calculatedData.map((item, index) => {
//         return {
//           SubSecCode: item.SubSecCode,
//           SecCode: item.SecurityCode,
//           ISIN: item.ISIN,
//           Date: item.Date,
//           Interest: item.Interest,
//           Principal: item.Principal,
//           Total: item.Total,
//           DCB: item.DCB,
//           YTM: item.YTM,
//           StartDateForValue: item.StartDateForValue,
//           DFForValuation: item.DFForValuation,
//           PVForValuation: item.PVForValuation,
//           Weightage: item.Weightage,
//           Tenor: item.Tenor,
//           MacaulayDuration: item.MacaulayDuration && item.MacaulayDuration,
//           RDDays: item.RDDays,
//           RDType: item.RDType,
//           RecordDate: item.RecordDate,
//           StartDate: item.StartDate,
//           DF: item.DF,
//           PV: item.PV,
//         };
//       });

//       // return res.json({
//       //   status: true,
//       //   stockmaster: redemption,
//       //   subsecinfo: redemption,
//       // });

//       // return res.json({ status: true, data: redemption });

//       const duplicatesredemption = await Promise.all(
//         redemption.map(async (data, i) => {
//           const res = await redemptionModel.findOne(data);
//           if (res) return true;
//           else {
//             return false;
//           }
//         })
//       );

//       const uniqueredemption = await Promise.all(
//         redemption.map(async (data, i) => {
//           if (!duplicatesredemption[i]) {
//             return data;
//           }
//         })
//       );
//       const updateduniqueredemption = uniqueredemption.filter((obj) => obj);

//       await redemptionModel.insertMany(updateduniqueredemption);

//       const result = await Promise.all(
//         data2
//           .filter((item) =>
//             stockmaster.find(
//               (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
//             )
//           )
//           .map(async (item, index) => {
//             // const ytm_value = item.CouponRate / 100;

//             const ytmvalues = stockmaster.filter(
//               (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
//             );

//             const ytm_value =
//               ytmvalues && ytmvalues.length ? ytmvalues[0].YTM : 0.0;

//             const subsecCode =
//               item.SecurityCode + "_" + (ytm_value * 100).toFixed(2);

//             const faceValue = calculatedData.reduce((total, curr) => {
//               return curr.SubSecCode === subsecCode &&
//                 utils.excelToJSDate(curr.Date) > system_date
//                 ? curr.Principal + total
//                 : total;
//             }, 0.0);

//             const CouponRate = item.CouponRate / 100;

//             let lipDate = new Date("0000-01-01");
//             let nipDate = new Date("0000-01-01");
//             let recordDate = new Date("0000-01-01");
//             let recordDate_date = new Date("0000-01-01");

//             for (let index = 0; index < calculatedData.length; index++) {
//               const item = calculatedData[index];
//               const date = utils.excelToJSDate(item.Date);

//               // lip date - filter exact and next smaller date from redempltion
//               if (
//                 date <= valueDate &&
//                 lipDate < date &&
//                 item.SubSecCode === subsecCode
//               ) {
//                 lipDate = date;
//               }

//               // nip date - filter exact and next larger date [redempltion] from system_date [current]

//               if (date > system_date && item.SubSecCode === subsecCode) {
//                 if (nipDate < system_date) {
//                   nipDate = date;
//                 } else if (nipDate > date) {
//                   nipDate = date;
//                 }
//               }

//               // recorddate - filter exact and next larger RecordDate [redempltion] from system_date [current]

//               if (item.RecordDate) {
//                 const RecordDate = new Date(item.RecordDate);
//                 if (date > system_date && item.SubSecCode === subsecCode) {
//                   if (recordDate_date < system_date) {
//                     recordDate_date = date;
//                     recordDate = RecordDate;
//                   } else if (recordDate_date > date) {
//                     recordDate_date = date;
//                     recordDate = RecordDate;
//                   }
//                 }
//               }
//             }

//             let nipdateforsettlement = new Date("0000-01-01");

//             for (let index = 0; index < calculatedData.length; index++) {
//               const item = calculatedData[index];
//               const date = utils.excelToJSDate(item.Date);

//               if (system_date > recordDate) {
//                 // nipdateforsettlement : filter exact and next larger Date [redempltion] than nipdate [current]
//                 if (date > nipDate && item.SubSecCode === subsecCode) {
//                   if (nipdateforsettlement < nipDate) {
//                     nipdateforsettlement = date;
//                   } else if (nipdateforsettlement > date) {
//                     nipdateforsettlement = date;
//                   }
//                 }
//               } else {
//                 nipdateforsettlement = nipDate;
//               }
//             }

//             let lipdateforsettlement = new Date("0000-01-01");

//             let dcbdate = new Date("0000-01-01");
//             let dcb = 0;

//             for (let index = 0; index < calculatedData.length; index++) {
//               const item = calculatedData[index];
//               const date = utils.excelToJSDate(item.Date);

//               // lip date - filter exact and next smaller date from redempltion
//               if (
//                 date < nipdateforsettlement &&
//                 lipdateforsettlement < date &&
//                 item.SubSecCode === subsecCode
//               ) {
//                 lipdateforsettlement = date;
//               }

//               // dcb - find dbc from redemption which have exact and next large date [redempltion] than settlement date [current]

//               if (date >= system_date && item.SubSecCode === subsecCode) {
//                 if (dcbdate < system_date) {
//                   dcbdate = date;
//                   dcb = item.DCB;
//                 } else if (dcbdate > date) {
//                   dcbdate = date;
//                   dcb = item.DCB;
//                 }
//               }
//             }

//             // calculate Int Acc per day ---------------------------------

//             const intaccperday_daysDiff =
//               (system_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

//             let intaccperday_a = (faceValue * CouponRate) / dcb;

//             let intaccperday_x = intaccperday_a * intaccperday_daysDiff;

//             let intaccperday_y = intaccperday_a * (intaccperday_daysDiff - 1);

//             let intaccperday_b =
//               Math.pow(1 + CouponRate, intaccperday_daysDiff / dcb - 1) *
//               faceValue;

//             let intaccperday_c =
//               Math.pow(1 + CouponRate, (intaccperday_daysDiff - 1) / dcb - 1) *
//               faceValue;

//             let intaccperday_d =
//               Math.pow(1 + CouponRate, 1 / dcb - 1) * faceValue;

//             let intaccperday =
//               item.CouponType === "S"
//                 ? system_date === lipdateforsettlement
//                   ? intaccperday_a
//                   : intaccperday_x - intaccperday_y
//                 : item.CouponType === "C"
//                 ? system_date === lipdateforsettlement
//                   ? intaccperday_d
//                   : intaccperday_b - intaccperday_c
//                 : "NA";

//             //------------------------------------------------------

//             // Calculating  DirtyPriceForSettlement by sum of all PV -----------------
//             const DirtyPriceForSettlement = calculatedData.reduce(
//               (total, curr) => {
//                 return curr.SubSecCode === subsecCode && curr.PV
//                   ? curr.PV + total
//                   : total;
//               },
//               0.0
//             );
//             //------------------------------------------------------

//             // calculate Int Acc per day for settlement-------------
//             const intaccperdayforsettlement_daysDiff =
//               (system_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

//             let intaccperdayforsettlement_a =
//               ((faceValue * CouponRate) / dcb) *
//               intaccperdayforsettlement_daysDiff;

//             let intaccperdayforsettlement_b =
//               (Math.pow(
//                 1 + CouponRate,
//                 intaccperdayforsettlement_daysDiff / dcb
//               ) -
//                 1) *
//               faceValue;

//             const intaccperdayforsettlement =
//               item.CouponType === "S"
//                 ? intaccperdayforsettlement_a
//                 : intaccperdayforsettlement_b;

//             //---------------------------------------------------------------------

//             let CleanPriceforSettlement = 0.0;

//             let CleanPriceforSettlement_a =
//               DirtyPriceForSettlement - intaccperdayforsettlement;

//             // Check the condition and round accordingly
//             if (CleanPriceforSettlement_a < 100) {
//               // CleanPriceforSettlement = Math.round(CleanPriceforSettlement_a, 4);
//               CleanPriceforSettlement = parseFloat(
//                 CleanPriceforSettlement_a.toFixed(4)
//               );
//             } else {
//               CleanPriceforSettlement = parseFloat(
//                 CleanPriceforSettlement_a.toFixed(2)
//               );
//               // CleanPriceforSettlement = Math.round(CleanPriceforSettlement_a,2);
//             }

//             //---------------------------------------------------------------

//             let Priceper100_percentage =
//               (CleanPriceforSettlement / faceValue) * 100;

//             // Round the result to 4 decimal places
//             const Priceper100 =
//               Math.round(Priceper100_percentage * 10000) / 10000;

//             // ---------------------------------------------------------------

//             const FaceValueForValuation_valueDate = new Date(system_date);
//             FaceValueForValuation_valueDate.setDate(
//               FaceValueForValuation_valueDate.getDate() - 1
//             );

//             const FaceValueForValuation = calculatedData.reduce(
//               (total, curr) => {
//                 return curr.SubSecCode === subsecCode &&
//                   utils.excelToJSDate(curr.Date) >
//                     FaceValueForValuation_valueDate
//                   ? curr.Principal + total
//                   : total;
//               },
//               0.0
//             );

//             //------------------------------------------

//             let Maturity_Date = new Date("0000-01-01");
//             calculatedData.forEach((curr) => {
//               if (
//                 curr.SubSecCode === subsecCode &&
//                 utils.excelToJSDate(curr.Date) > Maturity_Date
//               )
//                 Maturity_Date = utils.excelToJSDate(curr.Date);
//             });

//             //-------------------------------------------------------------

//             let LipDateForValuation = new Date("0000-01-01");

//             for (let index = 0; index < calculatedData.length; index++) {
//               const item = calculatedData[index];
//               const date = utils.excelToJSDate(item.Date);

//               if (
//                 date <= valueDate &&
//                 LipDateForValuation < date &&
//                 item.SubSecCode === subsecCode
//               ) {
//                 LipDateForValuation = date;
//               }
//             }

//             const DirtyPriceForValuation = calculatedData.reduce(
//               (total, curr) => {
//                 return curr.SubSecCode === subsecCode && curr.PVForValuation
//                   ? curr.PVForValuation + total
//                   : total;
//               },
//               0.0
//             );

//             const PrincipalRedemptionSinceLIP =
//               FaceValueForValuation - faceValue;

//             //---------------------------------------------------------------

//             const intaccsincelipforvaluation_daysDiff =
//               (valueDate - LipDateForValuation) / (1000 * 60 * 60 * 24);

//             const a =
//               ((FaceValueForValuation * CouponRate) / dcb) *
//               (intaccsincelipforvaluation_daysDiff + 1);

//             // Calculate 'b'
//             const b =
//               ((1 + CouponRate) **
//                 ((intaccsincelipforvaluation_daysDiff + 1) / dcb) -
//                 1) *
//               FaceValueForValuation;

//             // Determine the result based on the value of J5
//             let intaccsincelipforvaluation = 0.0;
//             if (item.CouponType === "S") {
//               intaccsincelipforvaluation = a;
//             } else if (item.CouponType === "C") {
//               intaccsincelipforvaluation = b;
//             } else {
//               intaccsincelipforvaluation = 0.0;
//             }

//             //---------------------------------------------------------------

//             let CleanPriceforValuation = 0.0;

//             let CleanPriceforValuation_a =
//               DirtyPriceForValuation -
//               PrincipalRedemptionSinceLIP -
//               intaccsincelipforvaluation;

//             // Check the condition and round accordingly
//             if (CleanPriceforValuation_a < 100) {
//               // CleanPriceforValuation = CleanPriceforValuation_a;
//               CleanPriceforValuation = parseFloat(
//                 CleanPriceforValuation_a.toFixed(4)
//               );
//             } else {
//               CleanPriceforValuation = parseFloat(
//                 CleanPriceforValuation_a.toFixed(2)
//               );
//               // CleanPriceforValuation = CleanPriceforValuation_a;
//             }

//             //---------------------------------------------------------

//             let PRDPrincipal = 0;
//             let PRDPrincipal_date = new Date("0000-01-01");
//             let PRDInterest = 0;
//             let PRDInterest_date = new Date("0000-01-01");

//             for (let index = 0; index < calculatedData.length; index++) {
//               const item = calculatedData[index];
//               const date = utils.excelToJSDate(item.Date);

//               if (system_date > recordDate) {
//                 if (date > system_date && item.SubSecCode === subsecCode) {
//                   if (PRDPrincipal_date < system_date) {
//                     PRDPrincipal_date = date;
//                     PRDPrincipal = item.Principal;
//                   } else if (PRDPrincipal_date > date) {
//                     PRDPrincipal_date = date;
//                     PRDPrincipal = item.Principal;
//                   }
//                 }
//               }

//               //---------------------------------------------------------------

//               if (system_date > recordDate) {
//                 if (date > system_date && item.SubSecCode === subsecCode) {
//                   if (PRDPrincipal_date < system_date) {
//                     PRDInterest_date = date;
//                     PRDInterest = item.Principal;
//                   } else if (PRDPrincipal_date > date) {
//                     PRDInterest_date = date;
//                     PRDInterest = item.Principal;
//                   }
//                 }
//               }
//             }

//             const CleanPriceForPRDUnits = CleanPriceforValuation - PRDPrincipal;

//             const MacaulayDuration = calculatedData.reduce((total, curr) => {
//               return curr.SubSecCode === subsecCode && curr.PVForValuation
//                 ? curr.MacaulayDuration + total
//                 : total;
//             }, 0.0);

//             const ModifiedDuration = MacaulayDuration / (1 + ytm_value);

//             return {
//               SubSecCode: subsecCode,
//               ValuationDate: valueDate,
//               SystemDate: system_date,
//               SecCode: item.SecurityCode,
//               ISIN: item.ISIN,
//               SecurityName: item.SecurityDescription,
//               YTM: ytm_value,
//               FaceValue: faceValue,
//               CouponRate,
//               CouponType: item.CouponType,
//               LIPDate: lipDate,
//               NIPDate: nipDate,
//               RecordDate: recordDate,
//               NIPDateForSettlement: nipdateforsettlement,
//               LIPDateForSettlement: lipdateforsettlement,
//               DCB: dcb,
//               IntAccPerDay: intaccperday,
//               DirtyPriceForSettlement,
//               IntAccPerDayForSettlement: intaccperdayforsettlement,
//               CleanPriceforSettlement,
//               Priceper100,
//               FaceValueForValuation,
//               MaturityDate: Maturity_Date,
//               LipDateForValuation,
//               DirtyPriceForValuation,
//               PrincipalRedemptionSinceLIP,
//               IntAccPerDayForValuation: intaccsincelipforvaluation,
//               CleanPriceforValuation,
//               PRDPrincipal,
//               PRDInterest,
//               CleanPriceForPRDUnits,
//               MacaulayDuration,
//               ModifiedDuration,
//             };
//           })
//       );

//       const duplicatesresult = await Promise.all(
//         result.map(async (data, i) => {
//           const res = await subsecinfoModel.findOne(data);
//           if (res) return true;
//           else {
//             return false;
//           }
//         })
//       );

//       const uniqueresult = await Promise.all(
//         result.map(async (data, i) => {
//           if (!duplicatesresult[i]) {
//             return data;
//           }
//         })
//       );

//       const updateduniqueresult = uniqueresult.filter((obj) => obj);
//       await subsecinfoModel.insertMany(updateduniqueresult);

//       // return res.json({ status: true, data: result });

//       const stockmaster1 = await Promise.all(
//         stockmaster
//           .filter((item) => item.YTM)
//           .map(async (item, index) => {
//             let {
//               ClientCode,
//               ClientName,
//               EventType,
//               TradeDate,
//               SettlementDate,
//               SecurityCode,
//               Quantity,
//               Rate,
//               InterestPerUnit,
//               StampDuty,
//               YTM,
//               SucuritySubCode,
//             } = item;

//             let FaceValuePerUnit = 0;
//             for (let index = 0; index < result.length; index++) {
//               const item = result[index];
//               // const date = utils.excelToJSDate(item.Date);

//               if (
//                 item.SystemDate.toString() === SettlementDate.toString() &&
//                 item.SecCode === SecurityCode
//               ) {
//                 FaceValuePerUnit += item.FaceValue;
//               }
//             }

//             const FaceValue =
//               EventType === "FI_RED"
//                 ? Quantity * Rate
//                 : Quantity * FaceValuePerUnit;

//             const CleanConsideration = Quantity * Rate;

//             const Amortisation = CleanConsideration - FaceValue;

//             const InterestAccrued = Quantity * InterestPerUnit;

//             const DirtyConsideration = CleanConsideration + InterestAccrued;

//             let TransactionNRD = "NA";

//             if (EventType !== "FI_RED") {
//               for (let index = 0; index < result.length; index++) {
//                 const item = result[index];

//                 if (item.RecordDate) {
//                   const RecordDate = new Date(item.RecordDate);

//                   if (
//                     item.SystemDate.toString() === SettlementDate.toString() &&
//                     item.SubSecCode === SucuritySubCode
//                   ) {
//                     TransactionNRD = RecordDate;
//                   }
//                 }
//               }
//             }

//             const PRDFlag = SettlementDate > TransactionNRD ? "Yes" : "";

//             let NextDueDate = new Date("0000-01-01");

//             for (let index = 0; index < result.length; index++) {
//               const item = result[index];

//               if (
//                 item.SystemDate.toString() === SettlementDate.toString() &&
//                 item.SubSecCode === SucuritySubCode
//               ) {
//                 NextDueDate = item.NIPDate;
//               }
//             }

//             const PRDHolding = SettlementDate >= NextDueDate ? "" : PRDFlag;

//             const UniqueCode = `${ClientCode}_${EventType}_${SecurityCode}_${index}`;

//             return {
//               ClientCode,
//               ClientName,
//               EventType,
//               TradeDate,
//               SettlementDate,
//               SecurityCode,
//               SucuritySubCode,
//               YTM,
//               Quantity,
//               Rate,
//               InterestPerUnit,
//               StampDuty,
//               FaceValuePerUnit,
//               FaceValue,
//               Amortisation,
//               CleanConsideration,
//               InterestAccrued,
//               DirtyConsideration,
//               TransactionNRD,
//               PRDFlag,
//               NextDueDate,
//               PRDHolding,
//               UniqueCode,
//             };
//           })
//       );

//       // return res.json({ status: true, data: stockmaster1 });

//       await systemDateModel.findOneAndUpdate(
//         {
//           SystemDate: system_date,
//           ValuationDate: valueDate,
//         },
//         {
//           SystemDate: system_date,
//           ValuationDate: valueDate,
//         },
//         { upsert: true, new: true }
//       );

//       let CGStmt = [];

//       for (let index = 0; index < stockmaster1.length; index++) {
//         const item = stockmaster1[index];

//         const UniqueCode = `${item.ClientCode}_${item.EventType}_${item.SecurityCode}`;

//         const isPresent = CGStmt.find(
//           (item) =>
//             `${item.ClientCode}_${item.EventType}_${item.SecurityCode}` ===
//             UniqueCode
//         );

//         if (!isPresent) {
//           CGStmt.push(item);
//         }
//       }

//       CGStmt = await Promise.all(
//         stockmaster1.map(async (item, index) => {
//           let {
//             ClientCode,
//             ClientName,
//             EventType,
//             TradeDate,
//             SettlementDate,
//             SecurityCode,
//             SucuritySubCode,
//             YTM,
//             Quantity,
//             Rate,
//             InterestPerUnit,
//             StampDuty,
//             FaceValuePerUnit,
//             FaceValue,
//             Amortisation,
//             CleanConsideration,
//             InterestAccrued,
//             DirtyConsideration,
//             TransactionNRD,
//             PRDFlag,
//             NextDueDate,
//             PRDHolding,
//             UniqueCode,
//           } = item;

//           const subsecinfoobj = result.find(
//             (obj) => obj.SecCode === SecurityCode
//           );
//           const SecurityName = subsecinfoobj.SecurityName;

//           const ISIN = subsecinfoobj.ISIN;

//           //---------------------------------------

//           let buyquantity = stockmaster1
//             .filter(
//               (item) =>
//                 item.ClientCode === ClientCode &&
//                 item.SecurityCode === SecurityCode &&
//                 item.EventType === "FL_PUR"
//             )
//             .map((item) => item.Quantity);

//           let sellquantity = stockmaster1
//             .filter(
//               (item) =>
//                 item.ClientCode === ClientCode &&
//                 item.SecurityCode === SecurityCode &&
//                 item.EventType === "FL_SAL" &&
//                 new Date(item.SettlementDate) <= new Date(system_date)
//             )
//             .map((item) => item.Quantity);

//           let i = 0;
//           let buy = 0;
//           let sell = 0;
//           while (buyquantity.length >= i + 1 && sellquantity.length >= i + 1) {
//             buy = buyquantity[i];
//             sell = sellquantity[i];

//             if (buy > sell) {
//               const diff = buy - sell;
//               if (diff > 0) {
//                 buyquantity = [
//                   ...buyquantity.slice(0, i + 1),
//                   diff,
//                   ...buyquantity.slice(i + 1),
//                 ];
//               }
//             } else if (buy === sell) {
//               break;
//             } else if (buy < sell) {
//               const diff = sell - buy;
//               if (diff > 0) {
//                 sellquantity.push(diff);
//               }
//             }

//             i++;
//           }

//           Quantity = Math.min(buy, sell);

//           //-------------------------------

//           const PurchaseDate =
//             EventType === "FI_PUR"
//               ? SettlementDate
//               : stockmaster1.find(
//                   (obj) =>
//                     obj.EventType === "FI_PUR" &&
//                     obj.ClientCode === ClientCode &&
//                     obj.SecurityCode === SecurityCode
//                 )?.SettlementDate;

//           const SaleDate =
//             EventType === "FI_SAL"
//               ? SettlementDate
//               : stockmaster1.find(
//                   (obj) =>
//                     obj.EventType === "FI_SAL" &&
//                     obj.ClientCode === ClientCode &&
//                     obj.SecurityCode === SecurityCode
//                 )?.SettlementDate;

//           const Holdingperiod =
//             SaleDate && PurchaseDate
//               ? (SaleDate - PurchaseDate) / (1000 * 60 * 60 * 24)
//               : 0;

//           const Purchasepriceobj = result.find(
//             (obj) =>
//               obj.SubSecCode === SucuritySubCode &&
//               obj.SettlementDate === SaleDate
//           );
//           const Purchaseprice = Purchasepriceobj
//             ? Purchasepriceobj.CleanPriceforSettlement
//             : 0;

//           const Salepriceobj = result.find(
//             (obj) =>
//               obj.SubSecCode === SucuritySubCode &&
//               obj.SettlementDate === PurchaseDate
//           );
//           const Saleprice = Purchasepriceobj
//             ? Purchasepriceobj.CleanPriceforSettlement
//             : 0;

//           const PurchaseValue = Purchaseprice * Quantity;
//           const SaleValue = Saleprice * Quantity;

//           const CaptialGainLoss = SaleValue - PurchaseValue;

//           const ListingStatusobj = data2.find(
//             (obj) => obj.SecurityCode === SecurityCode
//           );
//           const ListingStatus = ListingStatusobj?.ListingStatus;

//           let CaptialGainType = "";
//           if (ListingStatus === "Listed") {
//             if (Holdingperiod > 365) {
//               CaptialGainType = "Long-Term";
//             } else {
//               CaptialGainType = "Short Term";
//             }
//           } else {
//             if (Holdingperiod > 1095) {
//               CaptialGainType = "Long-Term";
//             } else {
//               CaptialGainType = "Short Term";
//             }
//           }

//           const PurchaseUniqueCode =
//             EventType === "FI_PUR"
//               ? UniqueCode
//               : stockmaster1.find(
//                   (obj) =>
//                     obj.EventType === "FI_PUR" &&
//                     obj.ClientCode === ClientCode &&
//                     obj.SecurityCode === SecurityCode
//                 )?.UniqueCode;

//           const SaleUniqueCode =
//             EventType === "FI_SAL"
//               ? UniqueCode
//               : stockmaster1.find(
//                   (obj) =>
//                     obj.EventType === "FI_SAL" &&
//                     obj.ClientCode === ClientCode &&
//                     obj.SecurityCode === SecurityCode
//                 )?.UniqueCode;

//           const PurchaseSubSecCode = SucuritySubCode;

//           return {
//             ClientCode,
//             ClientName,
//             SucuritySubCode,
//             SecurityName,
//             ISIN,
//             Quantity,
//             PurchaseDate,
//             SaleDate,
//             Purchaseprice,
//             Saleprice,
//             Holdingperiod,
//             PurchaseValue,
//             SaleValue,
//             ListingStatus,
//             CaptialGainType,
//             PurchaseUniqueCode,
//             SaleUniqueCode,
//             PurchaseSubSecCode,
//             SecurityCode,
//           };
//         })
//       );

//       // console.log(CGStmt);

//       for (let index = 0; index < stockmaster1.length; index++) {
//         const item = stockmaster1[index];

//         let Sellbalance = 0;
//         if (item.EventType === "FI_SAL") {
//           const sumquan = CGStmt.reduce((total, obj) => {
//             return obj.SaleUniqueCode === item.UniqueCode
//               ? total + obj.Quantity
//               : total;
//           }, 0);

//           Sellbalance = item.Quantity - sumquan;
//         }

//         stockmaster1[index].Sellbalance = Sellbalance;

//         let Buybalance = 0;
//         if (item.EventType === "FI_PUR") {
//           const sumquan = CGStmt.reduce((total, obj) => {
//             return obj.PurchaseUniqueCode === item.UniqueCode
//               ? total + obj.Quantity
//               : total;
//           }, 0);

//           Buybalance = item.Quantity - sumquan;
//         }

//         stockmaster1[index].Buybalance = Buybalance;
//       }

//       res.json({ status: true, stockmaster: stockmaster1, subsecinfo: result });
//     } catch (error) {
//       console.log(error);
//       res.status(500).json({ status: false, message: error.message });
//     }

//     // const newWorkbook = xlsx.utils.book_new();
//     // const newWorksheet = xlsx.utils.json_to_sheet(result);
//     // xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

//     // Save the new workbook
//     // const outputPath = path.join("uploads", "output.xlsx");
//     // xlsx.writeFile(newWorkbook, outputPath);

//     // res.download(outputPath, "output.xlsx", (err) => {
//     //   if (err) {
//     //     return res.status(500).json({ error: "Failed to download file" });
//     //   }
//     //   // Clean up the uploaded file and the generated Excel file after download
//     //   fs.unlink(outputPath, () => {});
//     // });
//     // res.json({
//     //   data: data.slice(0, 1),
//     //   calculatedData: calculatedData.slice(0, 1),
//     //   Redemption_Schedule,
//     //   result,
//     // });
//   }
// );

// app.post(
//   "/upload",
//   upload.fields([
//     { name: "file1", maxCount: 1 },
//     { name: "file2", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     const file1 = req.files["file1"][0];
//     const file2 = req.files["file2"][0];

//     const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
//     const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
//     const data1 = xlsx.utils.sheet_to_json(sheet1);

//     const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
//     const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
//     const data2 = xlsx.utils.sheet_to_json(sheet2);

//     const duplicates1 = await Promise.all(
//       data1.map(async (data, i) => {
//         const res = await cashflowModel.findOne(data);
//         if (res) return true;
//         else {
//           return false;
//         }
//       })
//     );

//     const uniquedocs1 = await Promise.all(
//       data1.map(async (data, i) => {
//         if (!duplicates1[i]) {
//           return data;
//         }
//       })
//     );
//     const updateduniquedocs1 = uniquedocs1.filter((obj) => obj);

//     await cashflowModel.insertMany(updateduniquedocs1);

//     const duplicates2 = await Promise.all(
//       data2.map(async (data, i) => {
//         const res = await secDetailModel.findOne(data);
//         if (res) return true;
//         else {
//           return false;
//         }
//       })
//     );

//     const uniquedocs2 = await Promise.all(
//       data2.map(async (data, i) => {
//         if (!duplicates2[i]) {
//           return data;
//         }
//       })
//     );
//     const updateduniquedocs2 = uniquedocs2.filter((obj) => obj);

//     await secDetailModel.insertMany(updateduniquedocs2);

//     res.json({
//       status: true,
//       message: "Upload Successfully",
//     });
//   }
// );

// // app.post(
// //   "/upload",
// //   upload.fields([
// //     { name: "file1", maxCount: 1 },
// //     { name: "file2", maxCount: 1 },
// //   ]),
// //   async (req, res) => {
// //     let { system_date } = req.body;
// //     system_date = new Date(system_date);

// //     const file1 = req.files["file1"][0];
// //     const file2 = req.files["file2"][0];
// //     // const file3 = req.files["file3"][0];

// //     const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
// //     const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
// //     const data1 = xlsx.utils.sheet_to_json(sheet1);

// //     const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
// //     const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
// //     const data2 = xlsx.utils.sheet_to_json(sheet2);

// //     // const workbook3 = xlsx.read(file3.buffer, { type: "buffer" });
// //     // const sheet3 = workbook3.Sheets[workbook3.SheetNames[0]];
// //     // const stockmaster = xlsx.utils.sheet_to_json(sheet3);

// //     const data = utils.joinDataArrays(data1, data2, "SecurityCode");

// //     // Map over the data array and calculate the new field for each item
// //     const calculatedData = await Promise.all(
// //       data.map(async (item, index) => {
// //         const ytm_value = item.CouponRate;

// //         const subsecCode = item.SecurityCode + "_" + ytm_value;

// //         const prevCFDate = await utils.calculatePrevCFDate(
// //           item,
// //           index,
// //           data,
// //           system_date
// //         );

// //         const StartDateForValue = await utils.calculateStartDateForValue(
// //           item,
// //           index,
// //           data,
// //           system_date
// //         );

// //         return {
// //           ...item,
// //           YTM: ytm_value,
// //           PrevCfDate: prevCFDate,
// //           SubSecCode: subsecCode,
// //           StartDateForValue,
// //         };
// //       })
// //     );

// //     // Calculate DF
// //     for (let index = 0; index < calculatedData.length; index++) {
// //       const item = calculatedData[index];

// //       const StartDate = await utils.calculateStartDate(
// //         item,
// //         index,
// //         data,
// //         system_date
// //       );
// //       calculatedData[index].StartDate = StartDate;

// //       const DF = await utils.calculateDF(item, index, calculatedData);
// //       calculatedData[index].DF = parseFloat(DF).toFixed(16);

// //       const DFForValuation = await utils.calculateDFForValuation(
// //         item,
// //         index,
// //         calculatedData,
// //         system_date
// //       );
// //       calculatedData[index].DFForValuation =
// //         parseFloat(DFForValuation).toFixed(16);

// //       const PVForValuation = await utils.calculatePVForValuation(
// //         item,
// //         system_date
// //       );
// //       calculatedData[index].PVForValuation = PVForValuation;

// //       // calculatedData[index].PV = PVForValuation;

// //       // const PV = !item.PrevCfDate || item.Total < 0 ? "" : item.Total * DF;
// //       // calculatedData[index].PV = PV;

// //       const PV = await utils.calculatePVMOdify(
// //         item,
// //         index,
// //         calculatedData,
// //         system_date
// //       );
// //       calculatedData[index].PV = PV;
// //     }

// //     await utils.calculateWeightage(calculatedData); // calculating weightage

// //     for (let index = 0; index < calculatedData.length; index++) {
// //       const item = calculatedData[index];

// //       const Tenor = await utils.calculateTenor(
// //         item,
// //         index,
// //         calculatedData,
// //         system_date
// //       );
// //       calculatedData[index].Tenor = Tenor;

// //       const MacaulayDuration = await utils.calculateMacaulayDuration(item);
// //       calculatedData[index].MacaulayDuration = MacaulayDuration;

// //       if (MacaulayDuration === "") {
// //         calculatedData[index].RDDays = "";
// //         calculatedData[index].RDType = "";
// //       }

// //       const recordDate = await utils.calculateRecordDateModify(item);
// //       calculatedData[index].RecordDate = recordDate;
// //     }

// //     const result = calculatedData.map((item, index) => {
// //       return {
// //         SubSecCode: item.SubSecCode,
// //         SecCode: item.SecurityCode,
// //         ISIN: item.ISIN,
// //         Date: item.Date,
// //         Interest: (item.Interest / 100).toFixed(2),
// //         Principal: (item.Principal / 100).toFixed(2),
// //         Total: (item.Total / 100).toFixed(2),
// //         DCB: item.DCB,
// //         YTM: item.YTM.toFixed(2),
// //         StartDateForValue: item.StartDateForValue,
// //         DFForValuation: item.DFForValuation,
// //         PVForValuation: item.PVForValuation,
// //         Weightage: item.Weightage,
// //         Tenor: item.Tenor.toFixed(2),
// //         MacaulayDuration:
// //           item.MacaulayDuration && item.MacaulayDuration.toFixed(9),
// //         RDDays: item.RDDays,
// //         RDType: item.RDType,
// //         RecordDate: item.RecordDate,
// //         StartDate: item.StartDate,
// //         DF: item.DF,
// //         PV: item.PV,
// //       };
// //     });

// //     const newWorkbook = xlsx.utils.book_new();
// //     const newWorksheet = xlsx.utils.json_to_sheet(result);
// //     xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

// //     // Save the new workbook
// //     const outputPath = path.join("uploads", `\output.xlsx`);
// //     xlsx.writeFile(newWorkbook, outputPath);

// //     // res.json({
// //     //   data: data.slice(0, 1),
// //     //   calculatedData: calculatedData.slice(0, 1),
// //     //   result,
// //     // });
// //     res.json({
// //       downloadUrl: `http://localhost:5000/download/${path.basename(
// //         outputPath
// //       )}`,
// //     });
// //   }
// // );

// app.get("/download/:filename", (req, res) => {
//   const filename = req.params.filename;
//   const filePath = path.join(__dirname, "uploads", filename);
//   res.download(filePath);
// });

// app.post("/cashflow", upload.single("file"), async (req, res) => {
//   try {
//     const { system_date } = req.body;
//     const data = await utils.readExcelFile(req.file.buffer);

//     // Map over the data array and calculate the new field for each item
//     const calculatedData = await Promise.all(
//       data.map(async (item, index) => {
//         const ytm_value = await utils.YTMcalculate(item);
//         const prevCFDate = await utils.calculatePrevCFDate(
//           item,
//           index,
//           data,
//           system_date
//         );

//         return { ...item, YTM: ytm_value, PrevCfDate: prevCFDate };
//       })
//     );

//     // Calculate DF
//     for (let index = 0; index < calculatedData.length; index++) {
//       const item = calculatedData[index];
//       const DF = await utils.calculateDF(item, index, calculatedData);
//       calculatedData[index].DF = parseFloat(DF).toFixed(16);

//       const recordDate = await utils.calculateRecordDate(item);
//       calculatedData[index].RecordDate = recordDate;

//       const PV = !item.PrevCfDate || item.Total < 0 ? "" : item.Total * DF;
//       calculatedData[index].PV = PV;
//     }

//     await utils.calculateWeightage(calculatedData); // calculating weightage

//     // Calculate Yrs & Calculate duration
//     for (let index = 0; index < calculatedData.length; index++) {
//       const item = calculatedData[index];
//       const yrs = await utils.calculateYrs(item, index, calculatedData);
//       calculatedData[index].Yrs = parseFloat(yrs).toFixed(2);

//       const duration = await utils.calculateDuration(item);
//       calculatedData[index].Duration = duration ? duration : "";
//     }

//     // Save the data to MongoDB
//     await cashflowModel.insertMany(calculatedData);
//     res.status(200).json({ message: "File uploaded successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.post("/secDetail", upload.single("file"), async (req, res) => {
//   const data = await utils.readExcelFile(req.file.buffer);
//   await secDetailModel.insertMany(data);
//   res.status(200).json({ message: "File uploaded successfully" });
// });

// app.post("/transaction", upload.single("file"), async (req, res) => {
//   const data = await utils.readExcelFile(req.file.buffer);
//   await transactionModel.insertMany(data);
//   res.status(200).json({ message: "File uploaded successfully" });
// });

// app.post("/secInfo", upload.single("file"), async (req, res) => {
//   const data = await utils.readExcelFile(req.file.buffer);
//   // console.log('data: ', data);

//   const calculatedData = await Promise.all(
//     data.map(async (item, index) => {
//       const secCode = await utils.secCode(item);
//       const secDetail = await secDetailModel.findOne({ secCode: secCode });
//       const ISIN = secDetail ? secDetail.ISIN : null;
//       const secName = secDetail ? secDetail.secName : null;
//       const transaction = await transactionModel.findOne({ ISIN: ISIN });
//       const YTM = transaction ? transaction.YTM : null;
//       const cashflowFilterData = await cashflowModel.find({
//         SubSecCode: item.SubSecCode,
//         Date: { $gt: item.ValuationDate },
//       });
//       const faceValue = await utils.faceValue(cashflowFilterData, item);
//       const couponRate = secDetail ? secDetail.CouponRate : null;
//       const CouponType = secDetail ? secDetail.CouponType : null;
//       const cashflowData = await cashflowModel.find();
//       const LIPDate = await utils.findLIPDate(cashflowData, item);
//       const NIPDate = await utils.findNIPDate(cashflowData, item);
//       const recordDate = await utils.findRecordDate(cashflowData, item);

//       return {
//         ...item,
//         secCode: secCode,
//         ISIN: ISIN,
//         secName: secName,
//         YTM: YTM,
//         faceValue: faceValue,
//         couponRate: couponRate,
//         CouponType: CouponType,
//         LIPDate: LIPDate,
//         NIPDate: NIPDate,
//         recordDate: recordDate,
//       };
//     })
//   );

//   console.log("calculatedData: ", calculatedData);
// });

// // app.post('/capitalGain', upload.single('file'),async(req,res)=>{
// //   const data = await utils.readExcelFile(req.file.buffer)
// // })

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "./dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "./dist/index.html"));
// });



require("dotenv").config();
const express = require("express");
const multer = require("multer");
const utils = require("./utils");
const xlsx = require("xlsx");
const app = express();
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const connectDB = require("./config/connectMongo");
const cashflowModel = require("./model/cashflowModel");
const secDetailModel = require("./model/secDetailModel");
const redemptionModel = require("./model/redemptionModel");
const subsecinfoModel = require("./model/subsecinfoModel");
const systemDateModel = require("./model/systemDateModel");
// const transactionModel = require("./model/transactionModel");
// const secInfoModel = require("./model/secInfoModel");

const moment = require('moment');

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

const date = moment();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
connectDB();

app.post("/download", async (req, res) => {
  try {
    let { from, to } = req.body;
    from = new Date(from);
    to = new Date(to);

    console.log(from, to);

    const result = await subsecinfoModel.find(
      {
        SystemDate: {
          $gte: from,
          $lte: to,
        },
      },
      {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      }
    );

    const cleanResult = result.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    if (cleanResult && !cleanResult.length) {
      return res.status(404).json({ status: false });
    }

    res.json({ status: true, data: cleanResult });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }

});

app.post(
  "/subsecinfo",
  upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
    { name: "file3", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let { system_date, from, to } = req.body;
      system_date = new Date(system_date);
      from = new Date(from);
      to = new Date(to);

      const valueDate = new Date(system_date);
      valueDate.setDate(valueDate.getDate() - 1);

      const file1 = req.files["file1"][0];
      const file2 = req.files["file2"][0];
      const file3 = req.files["file3"][0];

      const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
      const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
      const data1 = xlsx.utils.sheet_to_json(sheet1);

      const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
      const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
      const data2 = xlsx.utils.sheet_to_json(sheet2);

      const workbook3 = xlsx.read(file3.buffer, { type: "buffer" });
      const sheet3 = workbook3.Sheets[workbook3.SheetNames[0]];
      const stockmaster = xlsx.utils.sheet_to_json(sheet3);

      const data = utils.joinDataArrays(data1, data2, "SecurityCode");

      console.log("System Date", system_date);

      for (let index = 0; index < stockmaster.length; index++) {
        const item = stockmaster[index];

        let {
          ClientCode,
          ClientName,
          EventType,
          TradeDate,
          SettlementDate,
          SecurityCode,
          Quantity,
          Rate,
          InterestPerUnit,
          StampDuty,
        } = item;

        TradeDate = utils.excelToJSDate(TradeDate);
        stockmaster[index].TradeDate = TradeDate;

        SettlementDate = utils.excelToJSDate(SettlementDate);
        stockmaster[index].SettlementDate = SettlementDate;

        let YTM = 0.0;

        // if (new Date(system_date) >= new Date(SettlementDate)) {
        const prevYTMobj = stockmaster.find(
          (obj) => SecurityCode === obj.SecurityCode && obj.YTM
        );

        if (prevYTMobj) {
          YTM = prevYTMobj.YTM;
        } else {
          let filterarray = data.filter(
            (obj) =>
              obj.SecurityCode === SecurityCode &&
              utils.excelToJSDate(obj.Date) > SettlementDate
          );
          if (InterestPerUnit < 0) {
            filterarray = filterarray.slice(1);
          }

          const maparray = filterarray.map((obj) => {
            return {
              Date: utils.excelToJSDate(obj.Date),
              Total: obj.Total,
              DCB: obj.DCB,
            };
          });

          let ytmarray = [
            {
              Date: SettlementDate,
              Total: (Rate + InterestPerUnit) * -1,
              DF: 1.0,
            },
            ...maparray,
          ];

          let ytmvalues = [{ InitialYTM: 0.01, YTMdifferential: 0.01 }];

          let defaultInitialYTM = 0.01;
          let defaultYTMdifferential = 0.01;
          let i = 0;
          do {
            const InitialYTM = defaultInitialYTM;

            ytmvalues[i].InitialYTM = InitialYTM;

            const YTMdifferential = defaultYTMdifferential;

            ytmvalues[i].YTMdifferential = YTMdifferential;

            for (let index = 0; index < ytmarray.length; index++) {
              const item = ytmarray[index];

              if (index > 0) {
                const dayDiff =
                  (ytmarray[index].Date - ytmarray[index - 1].Date) /
                  (1000 * 60 * 60 * 24);
                ytmarray[index].DF =
                  item.DCB === ""
                    ? 0
                    : ytmarray[index - 1].DF /
                      Math.pow(1 + InitialYTM, dayDiff / item.DCB);
              }

              ytmarray[index].PV = ytmarray[index].Total * ytmarray[index].DF;
            }

            const OldDifference = ytmarray.reduce(
              (accumulator, currentobj) => accumulator + currentobj.PV,
              0
            );

            ytmvalues[i].OldDifference = parseFloat(OldDifference.toFixed(4));

            const AdjustedYTMDifferential =
              OldDifference < 0
                ? ytmvalues[i].YTMdifferential * -1
                : ytmvalues[i].YTMdifferential;
            ytmvalues[i].AdjustedYTMDifferential = AdjustedYTMDifferential;

            ytmvalues[i].ModifiedYTM =
              ytmvalues[i].InitialYTM + ytmvalues[i].AdjustedYTMDifferential;

            const ModifiedYTM = ytmvalues[i].ModifiedYTM;

            for (let index = 0; index < ytmarray.length; index++) {
              const item = ytmarray[index];

              if (index > 0) {
                const dayDiff =
                  (ytmarray[index].Date - ytmarray[index - 1].Date) /
                  (1000 * 60 * 60 * 24);

                ytmarray[index].DF =
                  item.DCB === ""
                    ? 0
                    : ytmarray[index - 1].DF /
                      Math.pow(1 + ModifiedYTM, dayDiff / item.DCB);
              }

              ytmarray[index].PV = ytmarray[index].Total * ytmarray[index].DF;
            }

            const NewDifference = ytmarray.reduce(
              (accumulator, currentobj) => accumulator + currentobj.PV,
              0
            );

            ytmvalues[i].NewDifference = parseFloat(NewDifference.toFixed(4));

            const ChangeInYTM =
              OldDifference > 0 === NewDifference > 0
                ? ModifiedYTM - InitialYTM
                : "NA";

            ytmvalues[i].ChangeInYTM = ChangeInYTM;

            const ChangeInDiff =
              ChangeInYTM === "NA" ? "NA" : NewDifference - OldDifference;

            ytmvalues[i].ChangeInDiff = ChangeInDiff;

            const RequiredChangeInDiff =
              ChangeInYTM === "NA" ? "NA" : OldDifference * -1;

            ytmvalues[i].RequiredChangeInDiff = RequiredChangeInDiff;

            const RequiredChangeYTM =
              ChangeInYTM === "NA"
                ? "NA"
                : isNaN(ChangeInDiff) || ChangeInDiff === 0
                ? 0
                : (ChangeInYTM * RequiredChangeInDiff) / ChangeInDiff;

            ytmvalues[i].RequiredChangeYTM = RequiredChangeYTM;

            const EndYTMv1 = ChangeInDiff === 0 ? ModifiedYTM : InitialYTM;
            const EndYTMv2 =
              RequiredChangeYTM === "NA"
                ? InitialYTM
                : InitialYTM + RequiredChangeYTM;
            const EndYTM = Math.max(EndYTMv1, EndYTMv2, -99.9999);

            ytmvalues[i].EndYTM = EndYTM;

            defaultInitialYTM = EndYTM;

            const SumOfTotal = ytmarray.reduce(
              (accumulator, currentobj) => accumulator + currentobj.Total,
              0
            );
            if (ChangeInDiff === "NA") {
              defaultYTMdifferential = YTMdifferential / 2;
            } else if (Math.abs(RequiredChangeInDiff / SumOfTotal) > 1) {
              defaultYTMdifferential = YTMdifferential;
            } else if (Math.abs(ChangeInDiff) < 0.1) {
              defaultYTMdifferential = YTMdifferential;
            } else {
              defaultYTMdifferential = YTMdifferential / 10;
            }

            ytmvalues.push({ InitialYTM: EndYTM });

            i++;
          } while (
            ytmvalues[i - 1].OldDifference > 0 ||
            ytmvalues[i - 1].NewDifference > 0 ||
            ytmvalues[i - 1].OldDifference < 0 ||
            ytmvalues[i - 1].NewDifference < 0
          );

          if (ytmvalues[i - 1].OldDifference <= 0) {
            YTM = ytmvalues[i - 1].InitialYTM;
          } else if (ytmvalues[i - 1].NewDifference <= 0) {
            YTM = ytmvalues[i - 1].ModifiedYTM;
          }
        }
        // }
        stockmaster[index].YTM = YTM;

        const SucuritySubCode = SecurityCode + "_" + (YTM * 100).toFixed(2);
        stockmaster[index].SucuritySubCode = SucuritySubCode;
      }

      // return res.json({
      //   status: true,
      //   stockmaster: stockmaster,
      //   subsecinfo: stockmaster,
      // });

      const calculatedData = await Promise.all(
        data
          .filter((item) =>
            stockmaster.find(
              (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
            )
          )
          .map(async (item, index) => {
            const ytmvalues = stockmaster.filter(
              (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
            );
            const YTM = ytmvalues && ytmvalues.length ? ytmvalues[0].YTM : 0.0;

            // const YTM = await utils.calculateYTM(item, index, data, system_date);

            const SubSecCode = item.SecurityCode + "_" + (YTM * 100).toFixed(2);

            const Interest = item.Interest;

            const Principal = item.Principal;

            const Total = item.Total;

            return {
              ...item,
              YTM,
              SubSecCode,
              Interest,
              Principal,
              Total,
            };
          })
      );

      // return res.json({
      //   status: true,
      //   stockmaster: calculatedData,
      //   subsecinfo: calculatedData,
      // });

      for (let index = 0; index < calculatedData.length; index++) {
        const item = calculatedData[index];

        const prevCFDate = await utils.calculatePrevCFDate(
          item,
          index,
          calculatedData,
          system_date
        );
        calculatedData[index].prevCFDate = prevCFDate;

        const StartDateForValue = await utils.calculateStartDateForValue(
          item,
          index,
          calculatedData,
          system_date
        );
        calculatedData[index].StartDateForValue = StartDateForValue;
      }

      // Calculate DF
      for (let index = 0; index < calculatedData.length; index++) {
        const item = calculatedData[index];

        const StartDate = await utils.calculateStartDate(
          item,
          index,
          calculatedData,
          system_date
        );
        calculatedData[index].StartDate = StartDate;

        const DF = await utils.calculateDF(item, index, calculatedData);
        calculatedData[index].DF = parseFloat(DF).toFixed(16);

        const DFForValuation = await utils.calculateDFForValuation(
          item,
          index,
          calculatedData,
          system_date
        );
        calculatedData[index].DFForValuation =
          parseFloat(DFForValuation).toFixed(16);

        const PVForValuation = await utils.calculatePVForValuation(
          item,
          system_date
        );
        calculatedData[index].PVForValuation = PVForValuation;
      }

      await utils.calculateWeightage(calculatedData); // calculating weightage

      for (let index = 0; index < calculatedData.length; index++) {
        const item = calculatedData[index];

        const Tenor = await utils.calculateTenor(
          item,
          index,
          calculatedData,
          system_date
        );
        calculatedData[index].Tenor = Tenor;

        const MacaulayDuration = await utils.calculateMacaulayDuration(item);
        calculatedData[index].MacaulayDuration = MacaulayDuration;

        if (MacaulayDuration === "") {
          calculatedData[index].RDDays = "";
          calculatedData[index].RDType = "";
        }

        const recordDate = await utils.calculateRecordDateModify(item);
        calculatedData[index].RecordDate = recordDate;

        const PV = await utils.calculatePVMOdify(
          item,
          index,
          calculatedData,
          system_date
        );
        calculatedData[index].PV = PV;
      }

      for (let index = 0; index < calculatedData.length; index++) {
        const item = calculatedData[index];
      }

      const redemption = calculatedData.map((item, index) => {
        return {
          SubSecCode: item.SubSecCode,
          SecCode: item.SecurityCode,
          ISIN: item.ISIN,
          Date: item.Date,
          Interest: item.Interest,
          Principal: item.Principal,
          Total: item.Total,
          DCB: item.DCB,
          YTM: item.YTM,
          StartDateForValue: item.StartDateForValue,
          DFForValuation: item.DFForValuation,
          PVForValuation: item.PVForValuation,
          Weightage: item.Weightage,
          Tenor: item.Tenor,
          MacaulayDuration: item.MacaulayDuration && item.MacaulayDuration,
          RDDays: item.RDDays,
          RDType: item.RDType,
          RecordDate: item.RecordDate,
          StartDate: item.StartDate,
          DF: item.DF,
          PV: item.PV,
        };
      });

      // return res.json({
      //   status: true,
      //   stockmaster: redemption,
      //   subsecinfo: redemption,
      // });

      // return res.json({ status: true, data: redemption });

      const duplicatesredemption = await Promise.all(
        redemption.map(async (data, i) => {
          const res = await redemptionModel.findOne(data);
          if (res) return true;
          else {
            return false;
          }
        })
      );

      const uniqueredemption = await Promise.all(
        redemption.map(async (data, i) => {
          if (!duplicatesredemption[i]) {
            return data;
          }
        })
      );
      const updateduniqueredemption = uniqueredemption.filter((obj) => obj);

      await redemptionModel.insertMany(updateduniqueredemption);

      const result = await Promise.all(
        data2
          .filter((item) =>
            stockmaster.find(
              (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
            )
          )
          .map(async (item, index) => {
            // const ytm_value = item.CouponRate / 100;

            const ytmvalues = stockmaster.filter(
              (obj) => obj.SecurityCode === item.SecurityCode && obj.YTM
            );

            const ytm_value =
              ytmvalues && ytmvalues.length ? ytmvalues[0].YTM : 0.0;

            const subsecCode =
              item.SecurityCode + "_" + (ytm_value * 100).toFixed(2);

            const faceValue = calculatedData.reduce((total, curr) => {
              return curr.SubSecCode === subsecCode &&
                utils.excelToJSDate(curr.Date) > system_date
                ? curr.Principal + total
                : total;
            }, 0.0);

            const CouponRate = item.CouponRate / 100;

            let lipDate = new Date("0000-01-01");
            let nipDate = new Date("0000-01-01");
            let recordDate = new Date("0000-01-01");
            let recordDate_date = new Date("0000-01-01");

            for (let index = 0; index < calculatedData.length; index++) {
              const item = calculatedData[index];
              const date = utils.excelToJSDate(item.Date);

              // lip date - filter exact and next smaller date from redempltion
              if (
                date <= valueDate &&
                lipDate < date &&
                item.SubSecCode === subsecCode
              ) {
                lipDate = date;
              }

              // nip date - filter exact and next larger date [redempltion] from system_date [current]

              if (date > system_date && item.SubSecCode === subsecCode) {
                if (nipDate < system_date) {
                  nipDate = date;
                } else if (nipDate > date) {
                  nipDate = date;
                }
              }

              // recorddate - filter exact and next larger RecordDate [redempltion] from system_date [current]

              if (item.RecordDate) {
                const RecordDate = new Date(item.RecordDate);
                if (date > system_date && item.SubSecCode === subsecCode) {
                  if (recordDate_date < system_date) {
                    recordDate_date = date;
                    recordDate = RecordDate;
                  } else if (recordDate_date > date) {
                    recordDate_date = date;
                    recordDate = RecordDate;
                  }
                }
              }
            }

            let nipdateforsettlement = new Date("0000-01-01");

            for (let index = 0; index < calculatedData.length; index++) {
              const item = calculatedData[index];
              const date = utils.excelToJSDate(item.Date);

              if (system_date > recordDate) {
                // nipdateforsettlement : filter exact and next larger Date [redempltion] than nipdate [current]
                if (date > nipDate && item.SubSecCode === subsecCode) {
                  if (nipdateforsettlement < nipDate) {
                    nipdateforsettlement = date;
                  } else if (nipdateforsettlement > date) {
                    nipdateforsettlement = date;
                  }
                }
              } else {
                nipdateforsettlement = nipDate;
              }
            }

            let lipdateforsettlement = new Date("0000-01-01");

            let dcbdate = new Date("0000-01-01");
            let dcb = 0;

            for (let index = 0; index < calculatedData.length; index++) {
              const item = calculatedData[index];
              const date = utils.excelToJSDate(item.Date);

              // lip date - filter exact and next smaller date from redempltion
              if (
                date < nipdateforsettlement &&
                lipdateforsettlement < date &&
                item.SubSecCode === subsecCode
              ) {
                lipdateforsettlement = date;
              }

              // dcb - find dbc from redemption which have exact and next large date [redempltion] than settlement date [current]

              if (date >= system_date && item.SubSecCode === subsecCode) {
                if (dcbdate < system_date) {
                  dcbdate = date;
                  dcb = item.DCB;
                } else if (dcbdate > date) {
                  dcbdate = date;
                  dcb = item.DCB;
                }
              }
            }

            // calculate Int Acc per day ---------------------------------

            const intaccperday_daysDiff =
              (system_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

            let intaccperday_a = (faceValue * CouponRate) / dcb;

            let intaccperday_x = intaccperday_a * intaccperday_daysDiff;

            let intaccperday_y = intaccperday_a * (intaccperday_daysDiff - 1);

            let intaccperday_b =
              Math.pow(1 + CouponRate, intaccperday_daysDiff / dcb - 1) *
              faceValue;

            let intaccperday_c =
              Math.pow(1 + CouponRate, (intaccperday_daysDiff - 1) / dcb - 1) *
              faceValue;

            let intaccperday_d =
              Math.pow(1 + CouponRate, 1 / dcb - 1) * faceValue;

            let intaccperday =
              item.CouponType === "S"
                ? system_date === lipdateforsettlement
                  ? intaccperday_a
                  : intaccperday_x - intaccperday_y
                : item.CouponType === "C"
                ? system_date === lipdateforsettlement
                  ? intaccperday_d
                  : intaccperday_b - intaccperday_c
                : "NA";

            //------------------------------------------------------

            // Calculating  DirtyPriceForSettlement by sum of all PV -----------------
            const DirtyPriceForSettlement = calculatedData.reduce(
              (total, curr) => {
                return curr.SubSecCode === subsecCode && curr.PV
                  ? curr.PV + total
                  : total;
              },
              0.0
            );
            //------------------------------------------------------

            // calculate Int Acc per day for settlement-------------
            const intaccperdayforsettlement_daysDiff =
              (system_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

            let intaccperdayforsettlement_a =
              ((faceValue * CouponRate) / dcb) *
              intaccperdayforsettlement_daysDiff;

            let intaccperdayforsettlement_b =
              (Math.pow(
                1 + CouponRate,
                intaccperdayforsettlement_daysDiff / dcb
              ) -
                1) *
              faceValue;

            const intaccperdayforsettlement =
              item.CouponType === "S"
                ? intaccperdayforsettlement_a
                : intaccperdayforsettlement_b;

            //---------------------------------------------------------------------

            let CleanPriceforSettlement = 0.0;

            let CleanPriceforSettlement_a =
              DirtyPriceForSettlement - intaccperdayforsettlement;

            // Check the condition and round accordingly
            if (CleanPriceforSettlement_a < 100) {
              // CleanPriceforSettlement = Math.round(CleanPriceforSettlement_a, 4);
              CleanPriceforSettlement = parseFloat(
                CleanPriceforSettlement_a.toFixed(4)
              );
            } else {
              CleanPriceforSettlement = parseFloat(
                CleanPriceforSettlement_a.toFixed(2)
              );
              // CleanPriceforSettlement = Math.round(CleanPriceforSettlement_a,2);
            }

            //---------------------------------------------------------------

            let Priceper100_percentage =
              (CleanPriceforSettlement / faceValue) * 100;

            // Round the result to 4 decimal places
            const Priceper100 =
              Math.round(Priceper100_percentage * 10000) / 10000;

            // ---------------------------------------------------------------

            const FaceValueForValuation_valueDate = new Date(system_date);
            FaceValueForValuation_valueDate.setDate(
              FaceValueForValuation_valueDate.getDate() - 1
            );

            const FaceValueForValuation = calculatedData.reduce(
              (total, curr) => {
                return curr.SubSecCode === subsecCode &&
                  utils.excelToJSDate(curr.Date) >
                    FaceValueForValuation_valueDate
                  ? curr.Principal + total
                  : total;
              },
              0.0
            );

            //------------------------------------------

            let Maturity_Date = new Date("0000-01-01");
            calculatedData.forEach((curr) => {
              if (
                curr.SubSecCode === subsecCode &&
                utils.excelToJSDate(curr.Date) > Maturity_Date
              )
                Maturity_Date = utils.excelToJSDate(curr.Date);
            });

            //-------------------------------------------------------------

            let LipDateForValuation = new Date("0000-01-01");

            for (let index = 0; index < calculatedData.length; index++) {
              const item = calculatedData[index];
              const date = utils.excelToJSDate(item.Date);

              if (
                date <= valueDate &&
                LipDateForValuation < date &&
                item.SubSecCode === subsecCode
              ) {
                LipDateForValuation = date;
              }
            }

            const DirtyPriceForValuation = calculatedData.reduce(
              (total, curr) => {
                return curr.SubSecCode === subsecCode && curr.PVForValuation
                  ? curr.PVForValuation + total
                  : total;
              },
              0.0
            );

            const PrincipalRedemptionSinceLIP =
              FaceValueForValuation - faceValue;

            //---------------------------------------------------------------

            const intaccsincelipforvaluation_daysDiff =
              (valueDate - LipDateForValuation) / (1000 * 60 * 60 * 24);

            const a =
              ((FaceValueForValuation * CouponRate) / dcb) *
              (intaccsincelipforvaluation_daysDiff + 1);

            // Calculate 'b'
            const b =
              ((1 + CouponRate) **
                ((intaccsincelipforvaluation_daysDiff + 1) / dcb) -
                1) *
              FaceValueForValuation;

            // Determine the result based on the value of J5
            let intaccsincelipforvaluation = 0.0;
            if (item.CouponType === "S") {
              intaccsincelipforvaluation = a;
            } else if (item.CouponType === "C") {
              intaccsincelipforvaluation = b;
            } else {
              intaccsincelipforvaluation = 0.0;
            }

            //---------------------------------------------------------------

            let CleanPriceforValuation = 0.0;

            let CleanPriceforValuation_a =
              DirtyPriceForValuation -
              PrincipalRedemptionSinceLIP -
              intaccsincelipforvaluation;

            // Check the condition and round accordingly
            if (CleanPriceforValuation_a < 100) {
              // CleanPriceforValuation = CleanPriceforValuation_a;
              CleanPriceforValuation = parseFloat(
                CleanPriceforValuation_a.toFixed(4)
              );
            } else {
              CleanPriceforValuation = parseFloat(
                CleanPriceforValuation_a.toFixed(2)
              );
              // CleanPriceforValuation = CleanPriceforValuation_a;
            }

            //---------------------------------------------------------

            let PRDPrincipal = 0;
            let PRDPrincipal_date = new Date("0000-01-01");
            let PRDInterest = 0;
            let PRDInterest_date = new Date("0000-01-01");

            if (system_date > recordDate) {
              for (let index = 0; index < calculatedData.length; index++) {
                const item = calculatedData[index];
                const date = utils.excelToJSDate(item.Date);

                if (date > system_date && item.SubSecCode === subsecCode) {
                  if (PRDPrincipal_date < system_date) {
                    PRDPrincipal_date = date;
                    PRDPrincipal = item.Principal;
                  } else if (PRDPrincipal_date > date) {
                    PRDPrincipal_date = date;
                    PRDPrincipal = item.Principal;
                  }
                }

                //---------------------------------------------------------------

                if (date > system_date && item.SubSecCode === subsecCode) {
                  if (PRDInterest_date < system_date) {
                    PRDInterest_date = date;
                    PRDInterest = item.Interest;
                  } else if (PRDPrincipal_date > date) {
                    PRDInterest_date = date;
                    PRDInterest = item.Interest;
                  }
                }
              }
            }

            const CleanPriceForPRDUnits = CleanPriceforValuation - PRDPrincipal;

            const MacaulayDuration = calculatedData.reduce((total, curr) => {
              return curr.SubSecCode === subsecCode && curr.PVForValuation
                ? curr.MacaulayDuration + total
                : total;
            }, 0.0);

            const ModifiedDuration = MacaulayDuration / (1 + ytm_value);

            return {
              SubSecCode: subsecCode,
              ValuationDate: valueDate,
              SystemDate: system_date,
              SecCode: item.SecurityCode,
              ISIN: item.ISIN,
              SecurityName: item.SecurityDescription,
              YTM: ytm_value,
              FaceValue: faceValue,
              CouponRate,
              CouponType: item.CouponType,
              LIPDate: lipDate,
              NIPDate: nipDate,
              RecordDate: recordDate,
              NIPDateForSettlement: nipdateforsettlement,
              LIPDateForSettlement: lipdateforsettlement,
              DCB: dcb,
              IntAccPerDay: intaccperday,
              DirtyPriceForSettlement,
              IntAccPerDayForSettlement: intaccperdayforsettlement,
              CleanPriceforSettlement,
              Priceper100,
              FaceValueForValuation,
              MaturityDate: Maturity_Date,
              LipDateForValuation,
              DirtyPriceForValuation,
              PrincipalRedemptionSinceLIP,
              IntAccPerDayForValuation: intaccsincelipforvaluation,
              CleanPriceforValuation,
              PRDPrincipal,
              PRDInterest,
              CleanPriceForPRDUnits,
              MacaulayDuration,
              ModifiedDuration,
            };
          })
      );

      return res.json({
        status: true,
        stockmaster: result,
        subsecinfo: result,
      });

      const duplicatesresult = await Promise.all(
        result.map(async (data, i) => {
          const res = await subsecinfoModel.findOne(data);
          if (res) return true;
          else {
            return false;
          }
        })
      );

      const uniqueresult = await Promise.all(
        result.map(async (data, i) => {
          if (!duplicatesresult[i]) {
            return data;
          }
        })
      );

      const updateduniqueresult = uniqueresult.filter((obj) => obj);
      await subsecinfoModel.insertMany(updateduniqueresult);

      const allsubsecinfo = await subsecinfoModel.find({});

      // return res.json({ status: true, data: result });

      // return res.json({
      //   status: true,
      //   stockmaster: stockmaster,
      //   subsecinfo: stockmaster,
      // });

      const stockmaster1 = await Promise.all(
        stockmaster
          .filter((item) => item.YTM)
          .map(async (item, index) => {
            let {
              ClientCode,
              ClientName,
              EventType,
              TradeDate,
              SettlementDate,
              SecurityCode,
              Quantity,
              Rate,
              InterestPerUnit,
              StampDuty,
              YTM,
              SucuritySubCode,
            } = item;

            let FaceValuePerUnit = 0;
            for (let index = 0; index < allsubsecinfo.length; index++) {
              const item = allsubsecinfo[index];
              // const date = utils.excelToJSDate(item.Date);

              if (
                item.SystemDate.toString() === SettlementDate.toString() &&
                item.SecCode === SecurityCode
              ) {
                FaceValuePerUnit = item.FaceValue;
              }
            }

            const FaceValue =
              EventType === "FI_RED"
                ? Quantity * Rate
                : Quantity * FaceValuePerUnit;

            const CleanConsideration = Quantity * Rate;

            const Amortisation = CleanConsideration - FaceValue;

            const InterestAccrued = Quantity * InterestPerUnit;

            const DirtyConsideration = CleanConsideration + InterestAccrued;

            let TransactionNRD = "NA";

            if (EventType !== "FI_RED") {
              for (let index = 0; index < allsubsecinfo.length; index++) {
                const item = allsubsecinfo[index];

                if (item.RecordDate) {
                  const RecordDate = new Date(item.RecordDate);

                  if (
                    item.SystemDate.toString() === SettlementDate.toString() &&
                    item.SecCode === SecurityCode
                  ) {
                    TransactionNRD = RecordDate;
                  }
                }
              }
            }

            const PRDFlag = SettlementDate > TransactionNRD ? "Yes" : "";

            let NextDueDate = new Date("0000-01-01");

            for (let index = 0; index < allsubsecinfo.length; index++) {
              const item = allsubsecinfo[index];

              if (
                item.SystemDate.toString() === SettlementDate.toString() &&
                item.SecCode === SecurityCode
              ) {
                NextDueDate = item.NIPDate;
              }
            }

            const PRDHolding = SettlementDate >= NextDueDate ? "" : PRDFlag;

            const UniqueCode = `${ClientCode}_${EventType}_${SecurityCode}_${index}`;

            return {
              ClientCode,
              ClientName,
              EventType,
              TradeDate,
              SettlementDate,
              SecurityCode,
              SucuritySubCode,
              YTM,
              Quantity,
              Rate,
              InterestPerUnit,
              StampDuty,
              FaceValuePerUnit,
              FaceValue,
              Amortisation,
              CleanConsideration,
              InterestAccrued,
              DirtyConsideration,
              TransactionNRD,
              PRDFlag,
              NextDueDate,
              PRDHolding,
              UniqueCode,
            };
          })
      );

      // return res.json({
      //   status: true,
      //   stockmaster: stockmaster1,
      //   subsecinfo: stockmaster1,
      // });

      // return res.json({ status: true, data: stockmaster1 });

      await systemDateModel.findOneAndUpdate(
        {
          SystemDate: system_date,
          ValuationDate: valueDate,
        },
        {
          SystemDate: system_date,
          ValuationDate: valueDate,
        },
        { upsert: true, new: true }
      );

      let CGStmt = [];

      for (let index = 0; index < stockmaster1.length; index++) {
        const item = stockmaster1[index];

        const UniqueCode = `${item.ClientCode}_${item.EventType}_${item.SecurityCode}`;

        const isPresent = CGStmt.find(
          (item) =>
            `${item.ClientCode}_${item.EventType}_${item.SecurityCode}` ===
            UniqueCode
        );

        if (!isPresent) {
          CGStmt.push(item);
        }
      }

      CGStmt = await Promise.all(
        stockmaster1.map(async (item, index) => {
          let {
            ClientCode,
            ClientName,
            EventType,
            TradeDate,
            SettlementDate,
            SecurityCode,
            SucuritySubCode,
            YTM,
            Quantity,
            Rate,
            InterestPerUnit,
            StampDuty,
            FaceValuePerUnit,
            FaceValue,
            Amortisation,
            CleanConsideration,
            InterestAccrued,
            DirtyConsideration,
            TransactionNRD,
            PRDFlag,
            NextDueDate,
            PRDHolding,
            UniqueCode,
          } = item;

          const subsecinfoobj = result.find(
            (obj) => obj.SecCode === SecurityCode
          );
          const SecurityName = subsecinfoobj.SecurityName;

          const ISIN = subsecinfoobj.ISIN;

          //---------------------------------------

          let buyquantity = stockmaster1
            .filter(
              (item) =>
                item.ClientCode === ClientCode &&
                item.SecurityCode === SecurityCode &&
                item.EventType === "FL_PUR"
            )
            .map((item) => item.Quantity);

          let sellquantity = stockmaster1
            .filter(
              (item) =>
                item.ClientCode === ClientCode &&
                item.SecurityCode === SecurityCode &&
                item.EventType === "FL_SAL" &&
                new Date(item.SettlementDate) <= new Date(system_date)
            )
            .map((item) => item.Quantity);

          let i = 0;
          let buy = 0;
          let sell = 0;
          while (buyquantity.length >= i + 1 && sellquantity.length >= i + 1) {
            buy = buyquantity[i];
            sell = sellquantity[i];

            if (buy > sell) {
              const diff = buy - sell;
              if (diff > 0) {
                buyquantity = [
                  ...buyquantity.slice(0, i + 1),
                  diff,
                  ...buyquantity.slice(i + 1),
                ];
              }
            } else if (buy === sell) {
              break;
            } else if (buy < sell) {
              const diff = sell - buy;
              if (diff > 0) {
                sellquantity.push(diff);
              }
            }

            i++;
          }

          Quantity = Math.min(buy, sell);

          //-------------------------------

          const PurchaseDate =
            EventType === "FI_PUR"
              ? SettlementDate
              : stockmaster1.find(
                  (obj) =>
                    obj.EventType === "FI_PUR" &&
                    obj.ClientCode === ClientCode &&
                    obj.SecurityCode === SecurityCode
                )?.SettlementDate;

          const SaleDate =
            EventType === "FI_SAL"
              ? SettlementDate
              : stockmaster1.find(
                  (obj) =>
                    obj.EventType === "FI_SAL" &&
                    obj.ClientCode === ClientCode &&
                    obj.SecurityCode === SecurityCode
                )?.SettlementDate;

          const Holdingperiod =
            SaleDate && PurchaseDate
              ? (SaleDate - PurchaseDate) / (1000 * 60 * 60 * 24)
              : 0;

          const Purchasepriceobj = result.find(
            (obj) =>
              obj.SubSecCode === SucuritySubCode &&
              obj.SettlementDate === SaleDate
          );
          const Purchaseprice = Purchasepriceobj
            ? Purchasepriceobj.CleanPriceforSettlement
            : 0;

          const Salepriceobj = result.find(
            (obj) =>
              obj.SubSecCode === SucuritySubCode &&
              obj.SettlementDate === PurchaseDate
          );
          const Saleprice = Purchasepriceobj
            ? Purchasepriceobj.CleanPriceforSettlement
            : 0;

          const PurchaseValue = Purchaseprice * Quantity;
          const SaleValue = Saleprice * Quantity;

          const CaptialGainLoss = SaleValue - PurchaseValue;

          const ListingStatusobj = data2.find(
            (obj) => obj.SecurityCode === SecurityCode
          );
          const ListingStatus = ListingStatusobj?.ListingStatus;

          let CaptialGainType = "";
          if (ListingStatus === "Listed") {
            if (Holdingperiod > 365) {
              CaptialGainType = "Long-Term";
            } else {
              CaptialGainType = "Short Term";
            }
          } else {
            if (Holdingperiod > 1095) {
              CaptialGainType = "Long-Term";
            } else {
              CaptialGainType = "Short Term";
            }
          }

          const PurchaseUniqueCode =
            EventType === "FI_PUR"
              ? UniqueCode
              : stockmaster1.find(
                  (obj) =>
                    obj.EventType === "FI_PUR" &&
                    obj.ClientCode === ClientCode &&
                    obj.SecurityCode === SecurityCode
                )?.UniqueCode;

          const SaleUniqueCode =
            EventType === "FI_SAL"
              ? UniqueCode
              : stockmaster1.find(
                  (obj) =>
                    obj.EventType === "FI_SAL" &&
                    obj.ClientCode === ClientCode &&
                    obj.SecurityCode === SecurityCode
                )?.UniqueCode;

          const PurchaseSubSecCode = SucuritySubCode;

          return {
            ClientCode,
            ClientName,
            SucuritySubCode,
            SecurityName,
            ISIN,
            Quantity,
            PurchaseDate,
            SaleDate,
            Purchaseprice,
            Saleprice,
            Holdingperiod,
            PurchaseValue,
            SaleValue,
            ListingStatus,
            CaptialGainType,
            PurchaseUniqueCode,
            SaleUniqueCode,
            PurchaseSubSecCode,
            SecurityCode,
          };
        })
      );

      // console.log(CGStmt);

      for (let index = 0; index < stockmaster1.length; index++) {
        const item = stockmaster1[index];

        let Sellbalance = 0;
        if (item.EventType === "FI_SAL") {
          const sumquan = CGStmt.reduce((total, obj) => {
            return obj.SaleUniqueCode === item.UniqueCode
              ? total + obj.Quantity
              : total;
          }, 0);

          Sellbalance = item.Quantity - sumquan;
        }

        stockmaster1[index].Sellbalance = Sellbalance;

        let Buybalance = 0;
        if (item.EventType === "FI_PUR") {
          const sumquan = CGStmt.reduce((total, obj) => {
            return obj.PurchaseUniqueCode === item.UniqueCode
              ? total + obj.Quantity
              : total;
          }, 0);

          Buybalance = item.Quantity - sumquan;
        }

        stockmaster1[index].Buybalance = Buybalance;
      }

      res.json({ status: true, stockmaster: stockmaster1, subsecinfo: result });
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: false, message: error.message });
    }

    // const newWorkbook = xlsx.utils.book_new();
    // const newWorksheet = xlsx.utils.json_to_sheet(result);
    // xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

    // Save the new workbook
    // const outputPath = path.join("uploads", "output.xlsx");
    // xlsx.writeFile(newWorkbook, outputPath);

    // res.download(outputPath, "output.xlsx", (err) => {
    //   if (err) {
    //     return res.status(500).json({ error: "Failed to download file" });
    //   }
    //   // Clean up the uploaded file and the generated Excel file after download
    //   fs.unlink(outputPath, () => {});
    // });
    // res.json({
    //   data: data.slice(0, 1),
    //   calculatedData: calculatedData.slice(0, 1),
    //   Redemption_Schedule,
    //   result,
    // });
  }
);

app.post(
  "/upload",
  upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
  ]),
  async (req, res) => {
    const file1 = req.files["file1"][0];
    const file2 = req.files["file2"][0];

    const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    const data1 = xlsx.utils.sheet_to_json(sheet1);

    const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    const data2 = xlsx.utils.sheet_to_json(sheet2);

    const duplicates1 = await Promise.all(
      data1.map(async (data, i) => {
        const res = await cashflowModel.findOne(data);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquedocs1 = await Promise.all(
      data1.map(async (data, i) => {
        if (!duplicates1[i]) {
          return data;
        }
      })
    );
    const updateduniquedocs1 = uniquedocs1.filter((obj) => obj);

    await cashflowModel.insertMany(updateduniquedocs1);

    const duplicates2 = await Promise.all(
      data2.map(async (data, i) => {
        const res = await secDetailModel.findOne(data);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquedocs2 = await Promise.all(
      data2.map(async (data, i) => {
        if (!duplicates2[i]) {
          return data;
        }
      })
    );
    const updateduniquedocs2 = uniquedocs2.filter((obj) => obj);

    await secDetailModel.insertMany(updateduniquedocs2);

    res.json({
      status: true,
      message: "Upload Successfully",
    });
  }
);

// app.post(
//   "/upload",
//   upload.fields([
//     { name: "file1", maxCount: 1 },
//     { name: "file2", maxCount: 1 },
//   ]),
//   async (req, res) => {
//     let { system_date } = req.body;
//     system_date = new Date(system_date);

//     const file1 = req.files["file1"][0];
//     const file2 = req.files["file2"][0];
//     // const file3 = req.files["file3"][0];

//     const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
//     const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
//     const data1 = xlsx.utils.sheet_to_json(sheet1);

//     const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
//     const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
//     const data2 = xlsx.utils.sheet_to_json(sheet2);

//     // const workbook3 = xlsx.read(file3.buffer, { type: "buffer" });
//     // const sheet3 = workbook3.Sheets[workbook3.SheetNames[0]];
//     // const stockmaster = xlsx.utils.sheet_to_json(sheet3);

//     const data = utils.joinDataArrays(data1, data2, "SecurityCode");

//     // Map over the data array and calculate the new field for each item
//     const calculatedData = await Promise.all(
//       data.map(async (item, index) => {
//         const ytm_value = item.CouponRate;

//         const subsecCode = item.SecurityCode + "_" + ytm_value;

//         const prevCFDate = await utils.calculatePrevCFDate(
//           item,
//           index,
//           data,
//           system_date
//         );

//         const StartDateForValue = await utils.calculateStartDateForValue(
//           item,
//           index,
//           data,
//           system_date
//         );

//         return {
//           ...item,
//           YTM: ytm_value,
//           PrevCfDate: prevCFDate,
//           SubSecCode: subsecCode,
//           StartDateForValue,
//         };
//       })
//     );

//     // Calculate DF
//     for (let index = 0; index < calculatedData.length; index++) {
//       const item = calculatedData[index];

//       const StartDate = await utils.calculateStartDate(
//         item,
//         index,
//         data,
//         system_date
//       );
//       calculatedData[index].StartDate = StartDate;

//       const DF = await utils.calculateDF(item, index, calculatedData);
//       calculatedData[index].DF = parseFloat(DF).toFixed(16);

//       const DFForValuation = await utils.calculateDFForValuation(
//         item,
//         index,
//         calculatedData,
//         system_date
//       );
//       calculatedData[index].DFForValuation =
//         parseFloat(DFForValuation).toFixed(16);

//       const PVForValuation = await utils.calculatePVForValuation(
//         item,
//         system_date
//       );
//       calculatedData[index].PVForValuation = PVForValuation;

//       // calculatedData[index].PV = PVForValuation;

//       // const PV = !item.PrevCfDate || item.Total < 0 ? "" : item.Total * DF;
//       // calculatedData[index].PV = PV;

//       const PV = await utils.calculatePVMOdify(
//         item,
//         index,
//         calculatedData,
//         system_date
//       );
//       calculatedData[index].PV = PV;
//     }

//     await utils.calculateWeightage(calculatedData); // calculating weightage

//     for (let index = 0; index < calculatedData.length; index++) {
//       const item = calculatedData[index];

//       const Tenor = await utils.calculateTenor(
//         item,
//         index,
//         calculatedData,
//         system_date
//       );
//       calculatedData[index].Tenor = Tenor;

//       const MacaulayDuration = await utils.calculateMacaulayDuration(item);
//       calculatedData[index].MacaulayDuration = MacaulayDuration;

//       if (MacaulayDuration === "") {
//         calculatedData[index].RDDays = "";
//         calculatedData[index].RDType = "";
//       }

//       const recordDate = await utils.calculateRecordDateModify(item);
//       calculatedData[index].RecordDate = recordDate;
//     }

//     const result = calculatedData.map((item, index) => {
//       return {
//         SubSecCode: item.SubSecCode,
//         SecCode: item.SecurityCode,
//         ISIN: item.ISIN,
//         Date: item.Date,
//         Interest: (item.Interest / 100).toFixed(2),
//         Principal: (item.Principal / 100).toFixed(2),
//         Total: (item.Total / 100).toFixed(2),
//         DCB: item.DCB,
//         YTM: item.YTM.toFixed(2),
//         StartDateForValue: item.StartDateForValue,
//         DFForValuation: item.DFForValuation,
//         PVForValuation: item.PVForValuation,
//         Weightage: item.Weightage,
//         Tenor: item.Tenor.toFixed(2),
//         MacaulayDuration:
//           item.MacaulayDuration && item.MacaulayDuration.toFixed(9),
//         RDDays: item.RDDays,
//         RDType: item.RDType,
//         RecordDate: item.RecordDate,
//         StartDate: item.StartDate,
//         DF: item.DF,
//         PV: item.PV,
//       };
//     });

//     const newWorkbook = xlsx.utils.book_new();
//     const newWorksheet = xlsx.utils.json_to_sheet(result);
//     xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

//     // Save the new workbook
//     const outputPath = path.join("uploads", `\output.xlsx`);
//     xlsx.writeFile(newWorkbook, outputPath);

//     // res.json({
//     //   data: data.slice(0, 1),
//     //   calculatedData: calculatedData.slice(0, 1),
//     //   result,
//     // });
//     res.json({
//       downloadUrl: `http://localhost:5000/download/${path.basename(
//         outputPath
//       )}`,
//     });
//   }
// );

app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  res.download(filePath);
});

app.post("/cashflow", upload.single("file"), async (req, res) => {
  try {
    const { system_date } = req.body;
    const data = await utils.readExcelFile(req.file.buffer);

    // Map over the data array and calculate the new field for each item
    const calculatedData = await Promise.all(
      data.map(async (item, index) => {
        const ytm_value = await utils.YTMcalculate(item);
        const prevCFDate = await utils.calculatePrevCFDate(
          item,
          index,
          data,
          system_date
        );

        return { ...item, YTM: ytm_value, PrevCfDate: prevCFDate };
      })
    );

    // Calculate DF
    for (let index = 0; index < calculatedData.length; index++) {
      const item = calculatedData[index];
      const DF = await utils.calculateDF(item, index, calculatedData);
      calculatedData[index].DF = parseFloat(DF).toFixed(16);

      const recordDate = await utils.calculateRecordDate(item);
      calculatedData[index].RecordDate = recordDate;

      const PV = !item.PrevCfDate || item.Total < 0 ? "" : item.Total * DF;
      calculatedData[index].PV = PV;
    }

    await utils.calculateWeightage(calculatedData); // calculating weightage

    // Calculate Yrs & Calculate duration
    for (let index = 0; index < calculatedData.length; index++) {
      const item = calculatedData[index];
      const yrs = await utils.calculateYrs(item, index, calculatedData);
      calculatedData[index].Yrs = parseFloat(yrs).toFixed(2);

      const duration = await utils.calculateDuration(item);
      calculatedData[index].Duration = duration ? duration : "";
    }

    // Save the data to MongoDB
    await cashflowModel.insertMany(calculatedData);
    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/secDetail", upload.single("file"), async (req, res) => {
  const data = await utils.readExcelFile(req.file.buffer);
  await secDetailModel.insertMany(data);
  res.status(200).json({ message: "File uploaded successfully" });
});

app.post("/transaction", upload.single("file"), async (req, res) => {
  const data = await utils.readExcelFile(req.file.buffer);
  await transactionModel.insertMany(data);
  res.status(200).json({ message: "File uploaded successfully" });
});

app.post("/secInfo", upload.single("file"), async (req, res) => {
  const data = await utils.readExcelFile(req.file.buffer);
  // console.log('data: ', data);

  const calculatedData = await Promise.all(
    data.map(async (item, index) => {
      const secCode = await utils.secCode(item);
      const secDetail = await secDetailModel.findOne({ secCode: secCode });
      const ISIN = secDetail ? secDetail.ISIN : null;
      const secName = secDetail ? secDetail.secName : null;
      const transaction = await transactionModel.findOne({ ISIN: ISIN });
      const YTM = transaction ? transaction.YTM : null;
      const cashflowFilterData = await cashflowModel.find({
        SubSecCode: item.SubSecCode,
        Date: { $gt: item.ValuationDate },
      });
      const faceValue = await utils.faceValue(cashflowFilterData, item);
      const couponRate = secDetail ? secDetail.CouponRate : null;
      const CouponType = secDetail ? secDetail.CouponType : null;
      const cashflowData = await cashflowModel.find();
      const LIPDate = await utils.findLIPDate(cashflowData, item);
      const NIPDate = await utils.findNIPDate(cashflowData, item);
      const recordDate = await utils.findRecordDate(cashflowData, item);

      return {
        ...item,
        secCode: secCode,
        ISIN: ISIN,
        secName: secName,
        YTM: YTM,
        faceValue: faceValue,
        couponRate: couponRate,
        CouponType: CouponType,
        LIPDate: LIPDate,
        NIPDate: NIPDate,
        recordDate: recordDate,
      };
    })
  );

  // console.log("calculatedData: ", calculatedData);
});

// app.post('/capitalGain', upload.single('file'),async(req,res)=>{
//   const data = await utils.readExcelFile(req.file.buffer)
// })

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./dist/index.html"));
});

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
const redemptionlatestModel = require("./model/redemptionlatestModel");
const subsecinfoModel = require("./model/subsecinfoModel");
const subsecinfolatestModel = require("./model/subsecinfolatestModel");
const systemDateModel = require("./model/systemDateModel");
const transactionModel = require("./model/transactionModal");
const { calculateresult } = require("./methods");
// const secInfoModel = require("./model/secInfoModel");

// Enable CORS for all requests
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  // const newWorkbook = xlsx.utils.book_new();
  // const newWorksheet = xlsx.utils.json_to_sheet(cleanResult);
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
});

app.post("/cashflowupload", upload.single("file"), async (req, res) => {
  try {
    const data = await utils.readExcelFile(req.file.buffer);

    const duplicates1 = await Promise.all(
      data.map(async (item, i) => {
        const res = await cashflowModel.findOne(item);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquedocs1 = data.filter((obj, i) => !duplicates1[i]);

    await cashflowModel.insertMany(uniquedocs1);

    res
      .status(200)
      .json({ status: true, message: "File uploaded successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/securityupload", upload.single("file"), async (req, res) => {
  try {
    const data = await utils.readExcelFile(req.file.buffer);

    // console.log(data);
    const duplicates1 = await Promise.all(
      data.map(async (item, i) => {
        const res = await secDetailModel.findOne(item);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquedocs1 = data.filter((obj, i) => !duplicates1[i]);

    await secDetailModel.insertMany(uniquedocs1);

    res
      .status(200)
      .json({ status: true, message: "File uploaded successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/stockmasterupload", upload.single("file"), async (req, res) => {
  try {
    const data = await utils.readExcelFile(req.file.buffer);

    // console.log(data);
    const duplicates1 = await Promise.all(
      data.map(async (item, i) => {
        const res = await transactionModel.findOne(item);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquedocs1 = data.filter((obj, i) => !duplicates1[i]);

    await transactionModel.insertMany(uniquedocs1);

    res
      .status(200)
      .json({ status: true, message: "File uploaded successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/subsecinfo", async (req, res) => {
  try {
    // console.log(req.body);
    let { system_date, from, to } = req.body;
    system_date = new Date(system_date);
    from = new Date(from);
    to = new Date(to);

    const valueDate = new Date(system_date);
    valueDate.setDate(valueDate.getDate() - 1);

    // const file1 = req.files["file1"][0];
    // const file2 = req.files["file2"][0];
    // const file3 = req.files["file3"][0];

    // const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
    // const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    // const data1 = xlsx.utils.sheet_to_json(sheet1);

    const data12 = await cashflowModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const data1 = data12.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    // console.log(data1);
    // console.log(data12[0]);

    // const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
    // const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    // const data2 = xlsx.utils.sheet_to_json(sheet2);

    const data21 = await secDetailModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const data2 = data21.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    // console.log(data2[0]);
    // console.log(data22[0]);

    // const workbook3 = xlsx.read(file3.buffer, { type: "buffer" });
    // const sheet3 = workbook3.Sheets[workbook3.SheetNames[0]];
    // const stockmaster = xlsx.utils.sheet_to_json(sheet3);

    const data31 = await transactionModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const stockmaster = data31.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const data = utils.joinDataArrays(data1, data2, "SecurityCode");

    console.log("System Date", system_date);

    // ------------ Calculating Ytm Stockmaster  --------------------
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

    //-----------------------------------------------------------------

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

    //-------- Calculating Redumption Data---------------------

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

    //Storing Redumption Data in db -----------------------------------------------------------

    await redemptionlatestModel.deleteMany({});
    await redemptionlatestModel.insertMany(redemption);

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

    //----------------------------------------------------------------

    const result = await calculateresult(
      data2,
      stockmaster,
      calculatedData,
      system_date,
      valueDate
    );

    // --------- Store result Data------------------------------------------
    await subsecinfolatestModel.deleteMany({});
    await subsecinfolatestModel.insertMany(result);

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

    //--------------------------------------------------------------------------

    const allsubsecinfo = await subsecinfoModel.find({});

    // return res.json({
    //   status: true,
    //   stockmaster: allsubsecinfo,
    //   subsecinfo: allsubsecinfo,
    // });

    // -------- Processing Stockmaster Data -----------------------------------------

    const stockmaster1 = await Promise.all(
      stockmaster
        .filter(
          (item) => item.YTM && item.SettlementDate <= system_date
          // &&
          //   allsubsecinfo.find((obj) => obj.SecCode === item.SecurityCode)
        )
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
              item.SystemDate.toISOString().split("T")[0] ===
                SettlementDate.toISOString().split("T")[0] &&
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
                  item.SystemDate.toISOString().split("T")[0] ===
                    SettlementDate.toISOString().split("T")[0] &&
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
              item.SystemDate.toISOString().split("T")[0] ===
                SettlementDate.toISOString().split("T")[0] &&
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

    // ----------------------------------------------------------------

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

    //-------------------- Calculating CGtmt Data  ------------------

    let CGStmt = [];

    for (let index = 0; index < stockmaster1.length; index++) {
      // const item = stockmaster1[index];
      let { UniqueCode, Quantity, EventType } = stockmaster1[index];

      const SellBalancearr = CGStmt.filter(
        (item) => item.SaleUniqueCode === UniqueCode
      );

      let SellBalance = 0;
      if (EventType === "FI_SAL") {
        let SellBalanceSum = SellBalancearr.reduce((sum, item) => {
          return item.Quantity ? sum + item.Quantity : sum;
        }, 0);

        SellBalance = Quantity - SellBalanceSum;
      } else {
        SellBalance = 0;
      }

      stockmaster1[index].SellBalance = SellBalance;

      const BuyBalancearr = CGStmt.filter(
        (item) => item.PurchaseUniqueCode === UniqueCode
      );

      let BuyBalance = 0;
      if (EventType === "FI_PUR") {
        let BuyBalanceSum = BuyBalancearr.reduce((sum, item) => {
          return item.Quantity ? sum + item.Quantity : sum;
        }, 0);

        BuyBalance = Quantity - BuyBalanceSum;
      } else {
        BuyBalance = 0;
      }

      stockmaster1[index].BuyBalance = BuyBalance;
    }

    const OuterFilterArr = stockmaster1.filter(
      (item) =>
        new Date(item.SettlementDate).toISOString().split("T")[0] ===
          new Date(system_date).toISOString().split("T")[0] &&
        item.EventType === "FI_SAL"
    );

    // console.log(OuterFilterArr);

    const OuterArr = OuterFilterArr.map((item) => {
      const sellBalancearr = stockmaster1.find(
        (obj) =>
          new Date(item.SettlementDate).toISOString().split("T")[0] ===
            new Date(obj.SettlementDate).toISOString().split("T")[0] &&
          obj.EventType === "FI_SAL" &&
          obj.ClientCode === item.ClientCode
      );

      let sellBalancesum = 0;
      if (sellBalancearr && sellBalancearr.length > 0) {
        sellBalancesum = sellBalancearr.reduce((total, item) => {
          return item.SellBalance ? total + item.SellBalance : total;
        }, 0);
      }

      return {
        SettlementDate: item.SettlementDate,
        ClientCode: item.ClientCode,
        SecurityCode: item.SecurityCode,
        looping: sellBalancesum,
      };
    });

    let cgmtindex = 0;

    while (cgmtindex < OuterArr.length) {
      const OuterObj = OuterArr[cgmtindex];

      const ResultArr = stockmaster1.filter(
        (item) =>
          item.ClientCode === OuterObj.ClientCode &&
          item.SecurityCode === OuterObj.SecurityCode
      );

      // console.log(ResultArr);

      // cgmtindex++;

      const sellArray = ResultArr.flatMap((outerItem) =>
        stockmaster1
          .filter(
            (stockItem) =>
              stockItem.SettlementDate === outerItem.SettlementDate &&
              stockItem.ClientCode === outerItem.ClientCode &&
              stockItem.SecurityCode === outerItem.SecurityCode &&
              stockItem.EventType === "FI_SAL" &&
              stockItem.SellBalance > 0
          )
          .map((stockItem) => ({
            ClientCode: stockItem.ClientCode,
            SecurityCode: stockItem.SecurityCode,
            SucuritySubCode: stockItem.SucuritySubCode,
            SalePrice: stockItem.Rate,
            SaleDate: stockItem.SettlementDate,
            SaleUniqueCode: stockItem.UniqueCode,
            Sell: stockItem.SellBalance, //storing lasted the SellBalance value
          }))
      );

      // console.log(sellArray);

      const buyArray = ResultArr.flatMap((outerItem) =>
        stockmaster1
          .filter(
            (stockItem) =>
              new Date(stockItem.SettlementDate) <=
                new Date(outerItem.SettlementDate) &&
              stockItem.ClientCode === outerItem.ClientCode &&
              stockItem.SecurityCode === outerItem.SecurityCode &&
              stockItem.EventType === "FI_PUR" &&
              stockItem.BuyBalance > 0
          )
          .map((stockItem) => ({
            PurchaseDate: stockItem.SettlementDate,
            PuchaseUniqueCode: stockItem.UniqueCode,
            PuchaseSubSecCode: stockItem.SucuritySubCode,
            Buy: stockItem.BuyBalance, //storing lasted the SellBalance value
          }))
      );

      // console.log(buyArray);

      sellArray.forEach(async (item, index) => {
        let Quantity = 0;
        let buy = buyArray[index].Buy;
        let sell = item.Sell;
        let saleQty = 0;
        let puchaseQty = 0;

        if (buy > sell) {
          Quantity = Math.min(sell, buy);
          puchaseQty = buy - Quantity;
          saleQty = 0;
          // Quantity = finalbuy;
        } else if (buy === sell) {
          Quantity = Math.min(sell, buy);
          puchaseQty = 0;
          saleQty = 0;
          // Quantity = finalsell;
        } else if (buy < sell) {
          Quantity = Math.min(sell, buy);
          puchaseQty = 0;
          saleQty = sell - Quantity;
          // Quantity = finalsell;
        }

        sellArray[index].Quantity = Quantity;
        sellArray[index].saleQty = saleQty;
        sellArray[index].puchaseQty = puchaseQty;

        const SaleDate = sellArray[index].SaleDate;
        const PurchaseDate = buyArray[index].PurchaseDate;
        const SecurityCode = sellArray[index].SecurityCode;
        const SucuritySubCode = sellArray[index].SucuritySubCode;
        const SalePrice = sellArray[index].SalePrice.toFixed(2);

        // ----------- Holding Period -----------
        const Holdingperiod =
          SaleDate && PurchaseDate
            ? (SaleDate - PurchaseDate) / (1000 * 60 * 60 * 24)
            : 0;

        // ----------- Purchase Price -----------
        const Purchasepriceobj = result.find(
          (obj) =>
            obj.SubSecCode === SucuritySubCode &&
            new Date(obj.SystemDate).toISOString().split("T")[0] ===
              new Date(SaleDate).toISOString().split("T")[0]
        );
        const Purchaseprice = Purchasepriceobj
          ? Purchasepriceobj.CleanPriceforSettlement
          : 0;

        // ---------------PurchaseValue----------
        const PurchaseValue = Purchaseprice * Quantity;
        // -----------------SaleValue------------
        const SaleValue = SalePrice * Quantity;
        // -----------------CapitalGainLoss--------------
        const CaptialGainLoss = SaleValue - PurchaseValue;
        // ---------------ListingStatus-----------

        // console.log(SecurityCode);
        const ListingStatusobj = data2.find(
          (obj) => obj.SecurityCode === SecurityCode
        );

        // console.log(ListingStatusobj);

        const ListingStatus = ListingStatusobj?.ListingStatus;

        // ------------------CapitalGainType-------------
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

        sellArray[index].Holdingperiod = Holdingperiod;
        sellArray[index].Purchaseprice = Purchaseprice;
        sellArray[index].PurchaseValue = PurchaseValue;
        sellArray[index].SaleValue = SaleValue;
        sellArray[index].CaptialGainLoss = CaptialGainLoss;
        sellArray[index].ListingStatus = ListingStatus;
        sellArray[index].CaptialGainType = CaptialGainType;
        sellArray[index].ClientName = ListingStatusobj.SecurityDescription;
        sellArray[index].ISIN = ListingStatusobj.ISIN;
        sellArray[index].PurchaseDate = buyArray[index].PurchaseDate;
        sellArray[index].PuchaseUniqueCode = buyArray[index].PuchaseUniqueCode;
        sellArray[index].PuchaseSubSecCode = buyArray[index].PuchaseSubSecCode;
      });

      // console.log(sellArray);

      CGStmt.push(sellArray[0]);

      for (let index = 0; index < stockmaster1.length; index++) {
        // const item = stockmaster1[index];
        let { UniqueCode, Quantity, EventType } = stockmaster1[index];

        const SellBalancearr = CGStmt.filter(
          (item) => item?.SaleUniqueCode === UniqueCode
        );

        // console.log(SellBalancearr);
        let SellBalance = 0;
        if (EventType === "FI_SAL") {
          let SellBalanceSum = 0;

          SellBalanceSum = SellBalancearr.reduce((sum, item) => {
            return item.Quantity ? sum + item.Quantity : sum;
          }, 0);

          SellBalance = Quantity - SellBalanceSum;
        } else {
          SellBalance = 0;
        }

        stockmaster1[index].SellBalance = SellBalance;

        const BuyBalancearr = CGStmt.filter(
          (item) => item?.PurchaseUniqueCode === UniqueCode
        );

        let BuyBalance = 0;
        if (EventType === "FI_PUR") {
          let BuyBalanceSum = BuyBalancearr.reduce((sum, item) => {
            return item.Quantity ? sum + item.Quantity : sum;
          }, 0);

          BuyBalance = Quantity - BuyBalanceSum;
        } else {
          BuyBalance = 0;
        }

        stockmaster1[index].BuyBalance = BuyBalance;
      }

      const loopingsellBalancearr = stockmaster1.filter(
        (obj) =>
          new Date(OuterObj.SettlementDate).toISOString().split("T")[0] ===
            new Date(obj.SettlementDate).toISOString().split("T")[0] &&
          obj.EventType === "FI_SAL" &&
          obj.ClientCode === OuterObj.ClientCode &&
          obj.SecurityCode === OuterObj.SecurityCode
      );

      let loopingBalancesum = 0;
      if (loopingsellBalancearr && loopingsellBalancearr.length > 0) {
        loopingBalancesum = loopingsellBalancearr.reduce((total, item) => {
          return item.SellBalance ? total + item.SellBalance : total;
        }, 0);
      }

      OuterArr[cgmtindex].looping = loopingBalancesum;

      if (loopingBalancesum === 0) {
        cgmtindex++;
      }
    }

    return res.json({
      status: true,
      stockmaster: CGStmt,
      subsecinfo: result,
    });

    // console.log(CGStmt);

    res.json({ status: true, stockmaster: stockmaster1, subsecinfo: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

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


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./dist/index.html"));
});

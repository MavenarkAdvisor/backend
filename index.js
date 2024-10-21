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
const stockmasterV3Model = require("./model/stockmasterV3Model");
const stockmasterV3latestModel = require("./model/stockmasterV3latestModel");
const stockmasterV2Model = require("./model/stockmasterV2Model");
const stockmasterV2latestModel = require("./model/stockmasterV2latestModel");
const subpositionModel = require("./model/subpositionModel");
const subpositionlatestModel = require("./model/subpositionlatestModel");
const positionModel = require("./model/positionModel");
const positionlatestModel = require("./model/positionlatestModel");
const ratingmasterModel = require("./model/ratingmasterModel");
const { calculateresult, calculateYTMStockmaster } = require("./methods");
const marketpriceModel = require("./model/marketpriceModel");
const marketpricelatestModel = require("./model/marketpricelatestModel");
const entrytypeModel = require("./model/entrytypeModel");
const ledgercodeModel = require("./model/ledgercodeModel");
const ledgerModel = require("./model/ledgerModel");
const trialbalanceModel = require("./model/trialbalanceModal");

// Enable CORS for all requests
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
connectDB();

app.post("/api/download", async (req, res) => {
  try {
    let { from, to, file } = req.body;
    from = new Date(from);
    to = new Date(to);

    console.log(req.body);

    let result;

    switch (file) {
      case "cashflow":
        from = utils.JSToExcelDate(from);
        to = utils.JSToExcelDate(to);

        result = await cashflowModel.find(
          {
            // Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "secDetail":
        from = utils.JSToExcelDate(from);
        to = utils.JSToExcelDate(to);

        result = await secDetailModel.find(
          {},
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "redemption":
        result = await redemptionModel.find(
          {
            // Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "subsecinfo":
        result = await subsecinfoModel.find(
          {
            SystemDate: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "transaction":
        result = await transactionModel.find(
          {
            SettlementDate: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "stockmasterV3":
        result = await stockmasterV3Model.find(
          {},
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "stockmasterV2":
        result = await stockmasterV2Model.find(
          {
            SettlementDate: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "subposition":
        result = await subpositionModel.find(
          {
            Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;
      case "position":
        result = await positionModel.find(
          {
            Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;
      case "ledger":
        result = await ledgerModel.find(
          {
            Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;
      case "trialbalance":
        result = await trialbalanceModel.find(
          {
            Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "ratingmaster":
        result = await ratingmasterModel.find(
          {},
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      case "marketprice":
        result = await marketpriceModel.find(
          {
            // Date: { $gte: from, $lte: to },
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          }
        );
        break;

      default:
        return res
          .status(400)
          .json({ status: false, message: "Invalid file name" });
    }

    const cleanResult = result.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    if (!cleanResult.length) {
      return res.status(404).json({
        status: false,
        message: "No data found in the specified range",
      });
    }

    res.json({ status: true, data: cleanResult });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.get("/api/systemdate", async (req, res) => {
  try {
    const result = await systemDateModel
      .findOne(
        {}, // no filter condition, fetch any document
        {
          _id: 0,
          __v: 0,
          createdAt: 0,
          updatedAt: 0,
        }
      )
      .sort({ SystemDate: -1 })
      .limit(1);

    res.json({ status: true, data: result });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/cashflowupload", upload.single("file"), async (req, res) => {
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

app.post("/api/securityupload", upload.single("file"), async (req, res) => {
  try {
    const data = await utils.readExcelFile(req.file.buffer);

    console.log(data);
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

app.post("/api/stockmasterupload", upload.single("file"), async (req, res) => {
  try {
    const data = await utils.readExcelFile(req.file.buffer);

    console.log(data);
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

app.post("/api/subsecinfo", async (req, res) => {
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

    let stockmaster = data31.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const data = utils.joinDataArrays(data1, data2, "SecurityCode");

    console.log("System Date", system_date);

    // ------------ Calculating Ytm Stockmaster  --------------------
    stockmaster = await calculateYTMStockmaster(stockmaster, data);

    console.log("Stockmaster YTM calculated");

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
          const YTM =
            ytmvalues && ytmvalues.length ? ytmvalues[0].YTM.toFixed(4) : 0.0;

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

    console.log("Redumption calculated");

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

    // console.log(updateduniqueresult);

    for (let doc of updateduniqueresult) {
      await subsecinfoModel.updateOne(
        { SystemDate: doc?.SystemDate, SecCode: doc.SecCode },
        { $set: doc },
        { upsert: true }
      );
    }

    console.log("Result/Subsecinfo data calculated");

    // await subsecinfoModel.insertMany(updateduniqueresult);

    //--------------------------------------------------------------------------

    const allsubsecinfo = await subsecinfoModel.find({});

    // return res.json({
    //   status: true,
    //   stockmaster: stockmasterV21,
    //   subsecinfo: allsubsecinfo,
    // });

    // -------- Processing Stockmaster Data -----------------------------------------

    const stockmasterV2 = await Promise.all(
      stockmaster
        .filter((item) => item.YTM && item.SettlementDate <= system_date)
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
            SecuritySubCode,
          } = item;

          let FaceValuePerUnit = 0;
          for (let index = 0; index < allsubsecinfo.length; index++) {
            const item = allsubsecinfo[index];
            // const date = utils.excelToJSDate(item.Date);

            // console.log(item.SystemDate);

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

          let TransactionNRD = new Date("0000-01-01");

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

          let CapitalGainLoss = 0;

          return {
            ClientCode,
            ClientName,
            EventType,
            TradeDate,
            SettlementDate,
            SecurityCode,
            SecuritySubCode,
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
            CapitalGainLoss
          };
        })
    );

    // ----------------------------------------------------------------

    // return res.json({
    //   status: true,
    //   stockmaster: stockmasterV2,
    //   subsecinfo: stockmasterV2,
    // });

    // return res.json({ status: true, data: stockmasterV2 });

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

    console.log("stockmasterv2 data calculated");

    //Calculating CGtmt Data  -----------------------------------

    let stockmasterV3 = [];

    for (let index = 0; index < stockmasterV2.length; index++) {
      // const item = stockmasterV2[index];
      let { UniqueCode, Quantity, EventType } = stockmasterV2[index];

      const SellBalancearr = stockmasterV3.filter(
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

      stockmasterV2[index].SellBalance = SellBalance;

      const BuyBalancearr = stockmasterV3.filter(
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

      stockmasterV2[index].BuyBalance = BuyBalance;
    }

    // return res.json({
    //   status: true,
    //   stockmaster: stockmasterV2,
    //   subsecinfo: stockmasterV2,
    // });

    const OuterFilterArr = stockmasterV2.filter(
      (item) =>
        new Date(item.SettlementDate).toISOString().split("T")[0] ===
        new Date(system_date).toISOString().split("T")[0] &&
        item.EventType === "FI_SAL"
    );

    // console.log(OuterFilterArr);

    const OuterArr = OuterFilterArr.map((item) => {
      const sellBalancearr = stockmasterV2.find(
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

    // console.log(OuterArr);

    let cgmtindex = 0;

    // return res.json({
    //   status: true,
    //   stockmaster: stockmasterV2,
    //   subsecinfo: stockmasterV2,
    // });

    let loopindex = 0;
    let sellArray;
    let buyArray;
    while (cgmtindex < OuterArr.length) {
      const OuterObj = OuterArr[cgmtindex];

      // const ResultArr = stockmasterV2.filter(
      //   (item) =>
      //     item.ClientCode === OuterObj.ClientCode &&
      //     item.SecurityCode === OuterObj.SecurityCode
      // );

      // console.log(ResultArr);

      // cgmtindex++;

      if (loopindex === 0) {
        sellArray = stockmasterV2
          .filter(
            (stockItem) =>
              stockItem.SettlementDate === OuterObj.SettlementDate &&
              stockItem.ClientCode === OuterObj.ClientCode &&
              stockItem.SecurityCode === OuterObj.SecurityCode &&
              stockItem.EventType === "FI_SAL" &&
              stockItem.SellBalance > 0
          )
          .map((stockItem) => ({
            ClientCode: stockItem.ClientCode,
            SecurityCode: stockItem.SecurityCode,
            SecuritySubCode: stockItem.SecuritySubCode,
            SalePrice: stockItem.Rate,
            SaleDate: stockItem.SettlementDate,
            SaleUniqueCode: stockItem.UniqueCode,
            Sell: stockItem.SellBalance, //storing lasted the SellBalance value
          }));

        // console.log(sellArray);

        buyArray = stockmasterV2
          .filter(
            (stockItem) =>
              new Date(stockItem.SettlementDate) <=
              new Date(OuterObj.SettlementDate) &&
              stockItem.ClientCode === OuterObj.ClientCode &&
              stockItem.SecurityCode === OuterObj.SecurityCode &&
              stockItem.EventType === "FI_PUR" &&
              stockItem.BuyBalance > 0
          )
          .map((stockItem) => ({
            ClientCode: stockItem.ClientCode,
            PurchaseDate: stockItem.SettlementDate,
            PurchaseUniqueCode: stockItem.UniqueCode,
            PurchaseSubSecCode: stockItem.SecuritySubCode,
            Buy: stockItem.BuyBalance, //storing lasted the SellBalance value
          }));
      }

      // sellArray.forEach(async (item, index) => {

      // while()

      let item = sellArray[loopindex];

      let Quantity = 0;
      let buy = buyArray[loopindex].Buy;
      let sell = item.Sell;
      let saleQty = 0;
      let purchaseQty = 0;

      if (buy > sell) {
        Quantity = Math.min(sell, buy);
        purchaseQty = buy - Quantity;
        saleQty = 0;

        const newitem = { ...buyArray[loopindex], Buy: purchaseQty };
        buyArray.push(newitem);

        // Quantity = finalbuy;
      } else if (buy === sell) {
        Quantity = Math.min(sell, buy);
        purchaseQty = 0;
        saleQty = 0;
        // Quantity = finalsell;
      } else if (buy < sell) {
        Quantity = Math.min(sell, buy);
        purchaseQty = 0;
        saleQty = sell - Quantity;
        const newitem = { ...item, Sell: saleQty };
        sellArray.push(newitem);
        // Quantity = finalsell;
      }

      sellArray[loopindex].Quantity = Quantity;
      sellArray[loopindex].saleQty = saleQty;
      sellArray[loopindex].purchaseQty = purchaseQty;

      const SaleDate = sellArray[loopindex].SaleDate;
      const PurchaseDate = buyArray[loopindex].PurchaseDate;
      const SecurityCode = sellArray[loopindex].SecurityCode;
      const SecuritySubCode = sellArray[loopindex].SecuritySubCode;
      const SalePrice = sellArray[loopindex].SalePrice.toFixed(2);

      // ----------- Holding Period -----------
      const Holdingperiod =
        SaleDate && PurchaseDate
          ? (SaleDate - PurchaseDate) / (1000 * 60 * 60 * 24)
          : 0;

      // ----------- Purchase Price -----------
      const Purchasepriceobj = result.find(
        (obj) =>
          obj.SubSecCode === SecuritySubCode &&
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
      const CapitalGainLoss = SaleValue - PurchaseValue;
      // ---------------ListingStatus-----------

      // console.log(SecurityCode);
      const ListingStatusobj = data2.find(
        (obj) => obj.SecurityCode === SecurityCode
      );

      // console.log(ListingStatusobj);

      const ListingStatus = ListingStatusobj?.ListingStatus;

      // ------------------CapitalGainType-------------
      let CapitalGainType = "";
      if (ListingStatus === "Listed") {
        if (Holdingperiod > 365) {
          CapitalGainType = "Long-Term";
        } else {
          CapitalGainType = "Short Term";
        }
      } else {
        if (Holdingperiod > 1095) {
          CapitalGainType = "Long-Term";
        } else {
          CapitalGainType = "Short Term";
        }
      }

      sellArray[loopindex].Holdingperiod = Holdingperiod;
      sellArray[loopindex].Purchaseprice = Purchaseprice;
      sellArray[loopindex].PurchaseValue = PurchaseValue;
      sellArray[loopindex].SaleValue = SaleValue;
      sellArray[loopindex].CapitalGainLoss = CapitalGainLoss;
      sellArray[loopindex].ListingStatus = ListingStatus;
      sellArray[loopindex].CapitalGainType = CapitalGainType;
      sellArray[loopindex].ClientName = ListingStatusobj.SecurityDescription;
      sellArray[loopindex].ISIN = ListingStatusobj.ISIN;
      sellArray[loopindex].PurchaseDate = buyArray[loopindex].PurchaseDate;
      sellArray[loopindex].PurchaseUniqueCode =
        buyArray[loopindex].PurchaseUniqueCode;
      sellArray[loopindex].PurchaseSubSecCode =
        buyArray[loopindex].PurchaseSubSecCode;

      // ----------OriginalPurchasePrice----------

      let OriginalPurchasePrice = 0;
      const matchedItem = stockmasterV2.find(
        (item) => item.UniqueCode === buyArray[loopindex].PurchaseUniqueCode
      );
      if (matchedItem) {
        OriginalPurchasePrice = matchedItem.Rate;
      }
      sellArray[loopindex].OriginalPurchasePrice = OriginalPurchasePrice;

      // -------------OriginalPurchaseValue-------------

      const OriginalPurchaseValue = OriginalPurchasePrice * Quantity;

      sellArray[loopindex].OriginalPurchaseValue = OriginalPurchaseValue;

      // ------------PRD Holding Flag---------------

      let PRDHoldingFlag = 0;
      const matchedItem1 = stockmasterV2.find(
        (item) => item.UniqueCode === sellArray[loopindex].SaleUniqueCode
      );
      if (matchedItem1) {
        PRDHoldingFlag = matchedItem1.PRDHolding;
      }

      sellArray[loopindex].PRDHoldingFlag = PRDHoldingFlag;

      // console.log(sellArray);

      stockmasterV3.push(sellArray[loopindex]);

      for (let index = 0; index < stockmasterV2.length; index++) {
        // const item = stockmasterV2[index];
        let {
          ClientCode,
          SecurityCode,
          Quantity,
          EventType,
          FaceValue,
          UniqueCode,
        } = stockmasterV2[index];

        if (EventType === "FI_SAL") {
          const totalPurchaseValue = stockmasterV3
            .filter(
              (itemV3) =>
                SecurityCode === itemV3.SecurityCode &&
                ClientCode === itemV3.ClientCode
            )
            .reduce((acc, itemV3) => acc + (itemV3.PurchaseValue || 0), 0); // Sum of PurchaseValue

          const recalculatedAmortisation = FaceValue - totalPurchaseValue;
          stockmasterV2[index].Amortisation = recalculatedAmortisation;
        }

        if (EventType === "FI_SAL") {
          const totalCapitalGainLoss = stockmasterV3
            .filter(
              (itemV4) =>
                SecurityCode === itemV4.SecurityCode &&
                ClientCode === itemV4.ClientCode
            )
            .reduce((acc, itemV4) => acc + (itemV4.CapitalGainLoss || 0), 0); // Sum of CapitalGainLoss

          stockmasterV2[index].CapitalGainLoss = totalCapitalGainLoss;
        }

        const SellBalancearr = stockmasterV3.filter(
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

        stockmasterV2[index].SellBalance = SellBalance;

        const BuyBalancearr = stockmasterV3.filter(
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

        stockmasterV2[index].BuyBalance = BuyBalance;
      }

      const loopingsellBalancearr = stockmasterV2.filter(
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

      if (
        loopingBalancesum === 0 ||
        !(sellArray.length > loopindex && buyArray.length > loopindex)
      ) {
        cgmtindex++;
        loopindex = 0;
      } else {
        loopindex++;
      }
    }

    console.log("stockmasterv3 data calculated");

    const duplicatesstockV3result = await Promise.all(
      stockmasterV3.map(async (data, i) => {
        const res = await stockmasterV3Model.findOne(data);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquestockV3result = await Promise.all(
      stockmasterV3.map(async (data, i) => {
        if (!duplicatesstockV3result[i]) {
          return data;
        }
      })
    );

    const updateduniquestockV3result = uniquestockV3result.filter((obj) => obj);

    await stockmasterV3Model.insertMany(updateduniquestockV3result);

    // -- Storing StockmasterV3 latest Eod results --------------------------------

    await stockmasterV3latestModel.deleteMany({});
    await stockmasterV3latestModel.insertMany(stockmasterV3);

    // -- Storing StockmasterV2 results --------------------------------
    const duplicatesstockV2result = await Promise.all(
      stockmasterV2.map(async (data, i) => {
        const res = await stockmasterV2Model.findOne({
          SettlementDate: data.SettlementDate,
        });
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquestockV2result = await Promise.all(
      stockmasterV2.map(async (data, i) => {
        if (!duplicatesstockV2result[i]) {
          return data;
        }
      })
    );

    const updateduniquestockV2result = uniquestockV2result.filter((obj) => obj);

    await stockmasterV2Model.insertMany(updateduniquestockV2result);

    // -- Storing StockmasterV2 latest Eod results --------------------------------

    await stockmasterV2latestModel.deleteMany({});
    await stockmasterV2latestModel.insertMany(stockmasterV2);

    // return res.json({
    //   status: true,
    //   stockmaster: stockmasterV3,
    //   subsecinfo: result,
    // });
    return res.json({
      status: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/subposition", async (req, res) => {
  try {
    let system_date = new Date(req.body.system_date);

    const valueDate = new Date(system_date);
    valueDate.setDate(valueDate.getDate() - 1);

    const stockmasterV2raw = await stockmasterV2latestModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const stockmasterV2 = stockmasterV2raw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const stockmasterV3raw = await stockmasterV3latestModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const stockmasterV3 = stockmasterV3raw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const PriceMasterraw = await subsecinfoModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const PriceMaster = PriceMasterraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const SubPosition = await Promise.all(
      stockmasterV2
        .filter((item) => {
          return (
            item.EventType === "FI_PUR" &&
            item.SettlementDate.toISOString().split("T")[0] <=
            system_date.toISOString().split("T")[0]
          );
        })
        .reduce(
          (acc, item) => {
            const { ClientCode, SecuritySubCode } = item;
            const key = `${ClientCode}-${SecuritySubCode}`; // Corrected template literal

            if (!acc.map.has(key)) {
              acc.map.set(key, true);
              acc.result.push(item);
            }

            return acc;
          },
          { map: new Map(), result: [] }
        )
        .result.map(async (item) => {
          const { ClientCode, SettlementDate, SecuritySubCode, SecurityCode } =
            item;

          // ---------------SecSubCodeQty-----------
          const SubSecCodeQtyArr1 = stockmasterV2
            .filter(
              (item) =>
                new Date(item.SettlementDate.toISOString().split("T")[0]) <=
                new Date(system_date.toISOString().split("T")[0]) &&
                item.ClientCode === ClientCode &&
                item.EventType === "FI_PUR" &&
                item.SecuritySubCode === SecuritySubCode
            )
            .reduce((sum, item) => sum + item.Quantity, 0);
          const SubSecCodeQtyArr2 = stockmasterV3
            .filter(
              (item) =>
                new Date(item.SaleDate.toISOString().split("T")[0]) <=
                new Date(system_date.toISOString().split("T")[0]) &&
                item.ClientCode === ClientCode &&
                item.PurchaseSubSecCode === SecuritySubCode
            )
            .reduce((sum, item) => sum + item.Quantity, 0);

          const SubSecCodeQty = SubSecCodeQtyArr1 - SubSecCodeQtyArr2;

          //-----------------CleanPrice_Today--------------
          let CleanPrice_Today = 0;
          const matchedItem = PriceMaster.find(
            (item) =>
              item.SystemDate.toISOString().split("T")[0] ===
              system_date.toISOString().split("T")[0] &&
              item.SubSecCode === SecuritySubCode
          );
          if (matchedItem) {
            CleanPrice_Today = matchedItem.CleanPriceforValuation;
          }

          //--------------HoldingValue_Today----------------------
          const HoldingValue_Today = SubSecCodeQty * CleanPrice_Today;

          // --------------HoldingCost-------------
          const HoldingCostArr1 = stockmasterV2
            .filter(
              (item) =>
                new Date(item.SettlementDate.toISOString().split("T")[0]) <=
                new Date(system_date.toISOString().split("T")[0]) &&
                item.ClientCode === ClientCode &&
                item.EventType === "FI_PUR" &&
                item.SecuritySubCode === SecuritySubCode
            )
            .reduce((sum, item) => sum + item.CleanConsideration, 0);

          const HoldingCostArr2 = stockmasterV3
            .filter(
              (item) =>
                new Date(item.SaleDate.toISOString().split("T")[0]) <=
                new Date(system_date.toISOString().split("T")[0]) &&
                item.ClientCode === ClientCode &&
                item.PurchaseSubSecCode === SecuritySubCode
            )
            .reduce((sum, item) => sum + item.OriginalPurchaseValue, 0);

          const HoldingCost = HoldingCostArr1 - HoldingCostArr2;

          //--------------AverageCostPerUnit--------------------
          const AverageCostPerUnit = HoldingCost / SubSecCodeQty;

          //--------------CumulativeAmortisation_Today-------------
          const CumulativeAmortisation_Today = HoldingValue_Today - HoldingCost;

          //--------------CleanPrice_PreviousDay-------------------
          let CleanPrice_PreviousDay;
          const matchedItem1 = PriceMaster.find(
            (item) =>
              item.SystemDate.toISOString().split("T")[0] ===
              valueDate.toISOString().split("T")[0] &&
              item.SubSecCode === SecuritySubCode
          );
          // console.log("matchedItem1", matchedItem1);
          CleanPrice_PreviousDay = matchedItem1
            ? matchedItem1.CleanPriceforValuation
            : AverageCostPerUnit;

          //--------------HoldingValue_PreviousDay-----------------
          const HoldingValue_PreviousDay =
            CleanPrice_PreviousDay * SubSecCodeQty;

          //--------------CumulativeAmortisation_PreviousDay-------
          let CumulativeAmortisation_PreviousDay;
          try {
            CumulativeAmortisation_PreviousDay =
              HoldingValue_PreviousDay - HoldingCost;
          } catch (error) {
            CumulativeAmortisation_PreviousDay = 0;
          }

          //--------------AmortisationForDay-----------------------
          const AmortisationForDay =
            CumulativeAmortisation_Today.toFixed(2) -
            CumulativeAmortisation_PreviousDay.toFixed(2);

          return {
            ClientCode,
            Date: system_date,
            SecuritySubCode,
            SecurityCode,
            SubSecCodeQty,
            CleanPrice_Today,
            HoldingValue_Today,
            HoldingCost,
            AverageCostPerUnit,
            CumulativeAmortisation_Today,
            CleanPrice_PreviousDay,
            HoldingValue_PreviousDay,
            CumulativeAmortisation_PreviousDay,
            AmortisationForDay,
          };
        })
    );

    // console.log(SubPosition);

    const duplicatessubposition = await Promise.all(
      SubPosition.map(async (data, i) => {
        const res = await subpositionModel.findOne({ Date: data.Date });
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquesubpositionresult = await Promise.all(
      SubPosition.map(async (data, i) => {
        if (!duplicatessubposition[i]) {
          return data;
        }
      })
    );

    const updateduniquesubposition = uniquesubpositionresult.filter(
      (obj) => obj
    );

    await subpositionModel.insertMany(updateduniquesubposition);

    // -- Storing StockmasterV2 latest Eod results --------------------------------

    await subpositionlatestModel.deleteMany({});
    await subpositionlatestModel.insertMany(SubPosition);

    res
      .status(200)
      .json({ status: true, message: "Sub-Position Calculated successfully" });
    // return res.json({
    //   status: true,
    //   subposition: SubPosition,
    // });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/marketprice", upload.single("file"), async (req, res) => {
  try {
    const marketpricesraw = await utils.readExcelFile(req.file.buffer);

    // console.log(marketpricesraw);

    const ratingmaster = await ratingmasterModel.find({});

    const Cashflowraw = await cashflowModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    // console.log("Cashflowraw", Cashflowraw);

    const Cashflow = Cashflowraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    // console.log("Cashflow", Cashflow);

    const SecDetailraw = await secDetailModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const SecDetails = SecDetailraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const marketprices = await Promise.all(
      marketpricesraw.map(async (item) => {
        const {
          ISIN,
          Date: datenum,
          DirtyPricePer100,
          InterestPer100,
          CleanPricePer100,
          CreditRating,
        } = item;

        const date = utils.excelToJSDate(datenum);

        let SecurityCode = 0;
        const matchedItem = SecDetails.find((item) => item.ISIN === ISIN);
        if (matchedItem) {
          SecurityCode = matchedItem.SecurityCode;
        }

        const FaceValue = Cashflow.reduce((total, curr) => {
          return curr.SecurityCode === SecurityCode &&
            utils.excelToJSDate(curr.Date) > new Date(date)
            ? curr.Principal + total
            : total;
        }, 0.0);

        const DirtyPrice = (DirtyPricePer100 / 100) * FaceValue;

        const Interest = (InterestPer100 / 100) * FaceValue;

        const CleanPrice =
          FaceValue < 100
            ? parseFloat((CleanPricePer100 / 100) * FaceValue).toFixed(4)
            : parseFloat((CleanPricePer100 / 100) * FaceValue).toFixed(4);

        const Rating = CreditRating.split(" ")[1];

        const entry = ratingmaster.find((entry) => entry.Rating === Rating);
        const RatingValue = entry ? entry.Value : null;

        // rate+ InterestPerUnit = marketPrice.DirtyPrice
        // other values fetch from the Cashflow upload as per last array

        return {
          SecurityCode,
          ISIN,
          Date: date,
          DirtyPricePer100,
          InterestPer100,
          CleanPricePer100,
          CreditRating,
          FaceValue,
          DirtyPrice,
          Interest,
          CleanPrice,
          Rating,
          RatingValue,
        };
      })
    );

    const data = utils.joinDataArrays(Cashflow, SecDetails, "SecurityCode");

    for (let index = 0; index < marketprices.length; index++) {
      const item = marketprices[index];

      let { SecurityCode, Date, DirtyPrice, InterestPer100 } = item;

      let YTM = 0.0;

      // if (new Date(system_date) >= new Date(SettlementDate)) {
      const prevYTMobj = marketprices.find(
        (obj) => SecurityCode === obj.SecurityCode && obj.YTM
      );

      if (prevYTMobj) {
        YTM = prevYTMobj.YTM;
        marketprices[index].YTM = YTM;
      } else {
        let filterarray = data.filter(
          (obj) =>
            obj.SecurityCode === SecurityCode &&
            utils.excelToJSDate(obj.Date) > Date
        );
        if (InterestPer100 < 0) {
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
            Date: Date,
            Total: DirtyPrice * -1,
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

        marketprices[index].YTM = YTM * 100;
      }
      // }
    }

    // console.log(marketprices);

    const duplicatesmarketpricesresult = await Promise.all(
      marketprices.map(async (data, i) => {
        const res = await marketpriceModel.findOne(data);
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquemarketpricesresult = await Promise.all(
      marketprices.map(async (data, i) => {
        if (!duplicatesmarketpricesresult[i]) {
          return data;
        }
      })
    );

    const updateduniquemarketpricesresult = uniquemarketpricesresult.filter(
      (obj) => obj
    );

    await marketpriceModel.insertMany(updateduniquemarketpricesresult);

    // -- Storing StockmasterV2 latest Eod results --------------------------------

    await marketpricelatestModel.deleteMany({});
    await marketpricelatestModel.insertMany(marketprices);

    // console.log(ratingmaster);

    // const duplicates1 = await Promise.all(
    //   data.map(async (item, i) => {
    //     const res = await secDetailModel.findOne(item);
    //     if (res) return true;
    //     else {
    //       return false;
    //     }
    //   })
    // );

    // const uniquedocs1 = data.filter((obj, i) => !duplicates1[i]);

    // await secDetailModel.insertMany(uniquedocs1);

    res
      .status(200)
      .json({ status: true, message: "File uploaded successfully" });
    // res.status(200).json({ status: true, marketprices });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/position", async (req, res) => {
  try {
    const SystemDate = new Date(req.body.system_date);

    const SubPositionraw = await subpositionModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const SubPosition = SubPositionraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const StockMasterV2raw = await stockmasterV2latestModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const StockMasterV2 = StockMasterV2raw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const StockMasterV3raw = await stockmasterV3latestModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const StockMasterV3 = StockMasterV3raw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const PriceMasterraw = await subsecinfoModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const PriceMaster = PriceMasterraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const MarketPricerraw = await marketpriceModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const MarketPrice = MarketPricerraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const position = await Promise.all(
      SubPosition.map(async (item) => {
        const { Date, ClientCode, SecurityCode } = item;

        const Qty = SubPosition.reduce((total, curr) => {
          return curr.Date === Date &&
            curr.ClientCode === ClientCode &&
            SecurityCode === SecurityCode
            ? curr.SubSecCodeQty + total
            : total;
        }, 0.0);

        const HoldingCost = SubPosition.reduce((total, curr) => {
          return curr.Date === Date &&
            curr.ClientCode === ClientCode &&
            SecurityCode === SecurityCode
            ? curr.HoldingCost + total
            : total;
        }, 0.0);

        const AverageCostPerUnit = HoldingCost / Qty;

        const HoldingValueOnToday = SubPosition.reduce((total, curr) => {
          return curr.Date === Date &&
            curr.ClientCode === ClientCode &&
            curr.SecurityCode === SecurityCode
            ? curr.HoldingValue_Today + total
            : total;
        }, 0);

        const CleanPrice = HoldingValueOnToday / Qty;

        const HoldingValueOnPreviousDay = SubPosition.reduce((total, item) => {
          return item.SecurityCode === SecurityCode &&
            item.Date.toISOString().split("T")[0] ===
            Date.toISOString().split("T")[0] &&
            item.ClientCode === ClientCode
            ? item.HoldingValue_PreviousDay + total
            : total;
        }, 0);

        const CumulativeAmortisationTillToday = SubPosition.reduce(
          (total, curr) => {
            return curr.Date === Date &&
              curr.ClientCode === ClientCode &&
              curr.SecurityCode === SecurityCode
              ? curr.CumulativeAmortisation_Today + total
              : total;
          },
          0
        );

        const CumulativeAmortisationTillPreviousDay = SubPosition.reduce(
          (total, curr) => {
            return curr.Date === Date &&
              curr.ClientCode === ClientCode &&
              curr.SecurityCode === SecurityCode
              ? curr.CumulativeAmortisation_PreviousDay + total
              : total;
          },
          0
        );

        const AmortisationForDay = parseFloat(
          (
            CumulativeAmortisationTillToday -
            CumulativeAmortisationTillPreviousDay
          ).toFixed(2)
        );

        const CorpActionArr1 = StockMasterV2.reduce((total, curr) => {
          return curr.SettlementDate <= Date &&
            curr.ClientCode === ClientCode &&
            curr.EventType === "FI_PUR" &&
            curr.SecurityCode === SecurityCode &&
            curr.PRDHolding === ""
            ? curr.Quantity + total
            : total;
        }, 0);
        const CorpActionArr2 = StockMasterV3.reduce((total, curr) => {
          return curr.SaleDate <= Date &&
            curr.SecurityCode === SecurityCode &&
            curr.ClientCode === ClientCode &&
            curr.PRDHoldingFlag === ""
            ? curr.Quantity + total
            : total;
        }, 0);

        const CorpActionQty = CorpActionArr1 - CorpActionArr2;

        // InterestAccruedPerUnitSinceLIPDate
        let InterestAccruedPerUnitSinceLIPDate = 0;
        const matchedItem3 = PriceMaster.find(
          (item) =>
            item.SystemDate.toISOString().split("T")[0] ===
            SystemDate.toISOString().split("T")[0] &&
            item.SecCode === SecurityCode
        );
        if (matchedItem3) {
          InterestAccruedPerUnitSinceLIPDate =
            matchedItem3.IntAccPerDayForValuation;
        }

        const InterestAccruedSinceLIPDate = parseFloat(
          InterestAccruedPerUnitSinceLIPDate * CorpActionQty
        ).toFixed(2);

        // InterestAccrualPerDayPerUnit
        let InterestAccrualPerDayPerUnit = 0;
        const matchedItem2 = PriceMaster.find(
          (item) =>
            item.SystemDate.toISOString().split("T")[0] ===
            SystemDate.toISOString().split("T")[0] &&
            item.SecCode === SecurityCode
        );
        if (matchedItem2) {
          InterestAccrualPerDayPerUnit = matchedItem2.IntAccPerDay;
        }

        const InterestAccrualForDay = parseFloat(
          InterestAccrualPerDayPerUnit * Qty
        ).toFixed(2);

        // PrincipalRedemptionPerUnitForDay
        let PrincipalRedemptionPerUnitForDay = 0;
        const matchedItem4 = PriceMaster.find(
          (item) =>
            item.SystemDate.toISOString().split("T")[0] ===
            SystemDate.toISOString().split("T")[0] &&
            item.SecCode === SecurityCode
        );
        if (matchedItem4) {
          PrincipalRedemptionPerUnitForDay =
            matchedItem4.PrincipalRedemptionSinceLIP;
        }

        const PrincipalRedemptionForDay = parseFloat(
          PrincipalRedemptionPerUnitForDay * Qty
        ).toFixed(2);

        // MarketPricePerUnitOnToday
        let MarketPricePerUnitOnToday = 0;

        const matchedItem5 = MarketPrice.find(
          (item) =>
            item.Date.toISOString().split("T")[0] ===
            SystemDate.toISOString().split("T")[0] &&
            item.SecurityCode === SecurityCode
        );

        if (matchedItem5) {
          MarketPricePerUnitOnToday = matchedItem5.CleanPrice;
        }

        const MarketValueOnToday = parseFloat(
          MarketPricePerUnitOnToday * Qty
        ).toFixed(2);

        const CumulativeUnrealisedGainLossUptoToDay =
          MarketValueOnToday - HoldingValueOnToday;

        return {
          Date,
          ClientCode,
          SecurityCode,
          Qty,
          HoldingCost,
          AverageCostPerUnit,
          HoldingValueOnToday,
          CleanPrice,
          HoldingValueOnPreviousDay,
          CumulativeAmortisationTillToday,
          CumulativeAmortisationTillPreviousDay,
          AmortisationForDay,
          CorpActionQty,
          InterestAccruedPerUnitSinceLIPDate,
          InterestAccruedSinceLIPDate,
          InterestAccrualPerDayPerUnit,
          InterestAccrualForDay,
          PrincipalRedemptionPerUnitForDay,
          PrincipalRedemptionForDay,
          MarketPricePerUnitOnToday,
          MarketValueOnToday,
          CumulativeUnrealisedGainLossUptoToDay,
        };
      })
    );

    // console.log(position);

    const duplicatesposition = await Promise.all(
      position.map(async (data, i) => {
        const res = await positionModel.findOne({ Date: data.Date });
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniquepositionresult = await Promise.all(
      position.map(async (data, i) => {
        if (!duplicatesposition[i]) {
          return data;
        }
      })
    );

    const updateduniqueposition = uniquepositionresult.filter((obj) => obj);

    await positionModel.insertMany(updateduniqueposition);

    // -- Storing StockmasterV2 latest Eod results --------------------------------

    await positionlatestModel.deleteMany({});
    await positionlatestModel.insertMany(position);

    // console.log(position);

    // res.status(200).json({ status: true, position });

    res
      .status(200)
      .json({ status: true, message: "Position Calculated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/ledger", async (req, res) => {
  try {
    // Fetch the required data
    const StockMasterV2raw = await stockmasterV2latestModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    const StockMasterV2 = StockMasterV2raw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const StockMasterV3raw = await stockmasterV3latestModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    const StockMasterV3 = StockMasterV3raw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const LedgerCoderaw = await ledgercodeModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    const LedgerCode = LedgerCoderaw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    const EntryTyperaw = await entrytypeModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );
    const EntryType = EntryTyperaw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    let Ledger = [];

    // Processing StockMasterV2
    StockMasterV2.forEach((itemV2) => {
      const {
        EventType,
        SettlementDate,
        ClientCode,
        SecurityCode,
        FaceValue,
        Amortisation,
        InterestAccrued,
        STT,
        Brokerage,
        TransactionCharges,
        TurnoverFees,
        ClearingCharges,
        GST,
        StampDuty,
      } = itemV2;

      // Calculate CapitalGainLoss from StockMasterV3
      const CapitalGainLoss =
        StockMasterV3.find(
          (itemV3) =>
            itemV2.SecurityCode === itemV3.SecurityCode &&
            itemV2.ClientCode === itemV3.ClientCode
        )?.CapitalGainLoss || 0;

      const Date = SettlementDate;

      // Get the correct EntryType
      const entryTypeObj = EntryType.find((et) => et.EntryType === EventType);
      const Narration = entryTypeObj?.DefaultNarration;

      // Iterate over LedgerCode
      LedgerCode.forEach((itemLedger) => {
        const { LedgerCode, LedgerName } = itemLedger;
        let amount;

        // Calculate amount based on the EventType and LedgerCode
        if (EventType === "FI_PUR") {
          switch (LedgerCode) {
            case "A1000":
              amount = -(
                (FaceValue ?? 0) +
                (Amortisation ?? 0) +
                (InterestAccrued ?? 0) +
                (StampDuty ?? 0) +
                (Brokerage ?? 0) +
                (TransactionCharges ?? 0) +
                (TurnoverFees ?? 0) +
                (ClearingCharges ?? 0) +
                (GST ?? 0) +
                (STT ?? 0)
              );
              break;
            case "A1001":
              amount = FaceValue;
              break;
            case "A1003":
              amount = Amortisation;
              break;
            case "A1005":
              amount = InterestAccrued;
              break;
            case "A1009":
              amount = StampDuty;
              break;
            case "E1010":
              amount = Brokerage;
              break;
            case "E1011":
              amount = TransactionCharges;
              break;
            case "E1012":
              amount = TurnoverFees;
              break;
            case "E1013":
              amount = ClearingCharges;
              break;
            case "E1014":
              amount = GST;
              break;
            case "E1015":
              amount = STT;
              break;
            default:
              amount = null;
          }
        } else if (EventType === "FI_SAL") {
          switch (LedgerCode) {
            case "A1000":
              amount =
                (FaceValue ?? 0) +
                (Amortisation ?? 0) +
                (InterestAccrued ?? 0) +
                (StampDuty ?? 0) +
                (Brokerage ?? 0) +
                (TransactionCharges ?? 0) +
                (TurnoverFees ?? 0) +
                (ClearingCharges ?? 0) +
                (GST ?? 0) +
                (STT ?? 0);
              break;
            case "A1001":
              amount = -FaceValue;
              break;
            case "A1003":
              amount = -Amortisation;
              break;
            case "A1005":
              amount = -InterestAccrued;
              break;
            case "E1009":
              amount = -StampDuty;
              break;
            case "E1010":
              amount = -Brokerage;
              break;
            case "E1011":
              amount = -TransactionCharges;
              break;
            case "E1012":
              amount = -TurnoverFees;
              break;
            case "E1013":
              amount = -ClearingCharges;
              break;
            case "E1014":
              amount = -GST;
              break;
            case "E1015":
              amount = -STT;
              break;
            case "I1007":
              amount = -CapitalGainLoss;
              break;
            default:
              amount = null;
          }
        }

        const CrDr = amount > 0 ? "D" : amount < 0 ? "C" : "";

        amount = utils.getValueOrEmpty(amount);

        if (amount !== null && amount !== undefined) {
          Ledger.push({
            EventType,
            LedgerCode,
            ClientCode,
            Date,
            SecurityCode,
            Amount: amount,
            LedgerName,
            CrDr,
            Narration,
          });
        }
      });
    });
    // console.log(Ledger);

    const duplicatesledger = await Promise.all(
      Ledger.map(async (data, i) => {
        const res = await ledgerModel.findOne({ Date: data.Date });
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniqueledgerresult = await Promise.all(
      Ledger.map(async (data, i) => {
        if (!duplicatesledger[i]) {
          return data;
        }
      })
    );

    const updateduniqueledger = uniqueledgerresult.filter((obj) => obj);

    await ledgerModel.insertMany(updateduniqueledger);

    res
      .status(200)
      .json({ status: true, message: "Ledger Calculated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post("/api/trialbalance", async (req, res) => {
  try {
    const ledgerraw = await ledgerModel.find(
      {},
      { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }
    );

    const ledger = ledgerraw.map((doc) =>
      doc.toObject({ getters: true, virtuals: false })
    );

    // Ledger data
    const trialbalance = ledger.map((itemV2) => {
      const { LedgerCode, ClientCode, Date: date, LedgerName } = itemV2;

      const amt1 = ledger
        .filter(
          (item) =>
            item.ClientCode === ClientCode &&
            item.LedgerCode === LedgerCode &&
            item.Date === date
        )
        .reduce((sum, item) => sum + item.Amount, 0);

      const amt2 = ledger
        .filter(
          (item) =>
            item.ClientCode === ClientCode &&
            item.LedgerCode === LedgerCode &&
            new Date(item.Date) <= new Date(date)
        )
        .reduce((sum, item) => sum + item.Amount, 0);

      const Amount =
        LedgerCode.startsWith("E") || LedgerCode.startsWith("I") ? amt1 : amt2;

      return {
        LedgerCode,
        ClientCode,
        Date: date,
        LedgerName,
        Amount,
      };
    });

    const duplicatesdata = await Promise.all(
      trialbalance.map(async (data, i) => {
        const res = await trialbalanceModel.findOne({ Date: data.Date });
        if (res) return true;
        else {
          return false;
        }
      })
    );

    const uniqueresult = await Promise.all(
      trialbalance.map(async (data, i) => {
        if (!duplicatesdata[i]) {
          return data;
        }
      })
    );

    const updateduniqueresult = uniqueresult.filter((obj) => obj);

    await trialbalanceModel.insertMany(updateduniqueresult);

    console.log("TrialBalance Calculated");

    res
      .status(200)
      .json({ status: true, message: "Trial Balance Calculated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post(
  "/api/upload",
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

app.get("/api/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  res.download(filePath);
});

app.post("/api/cashflow", upload.single("file"), async (req, res) => {
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

app.post("/api/secDetail", upload.single("file"), async (req, res) => {
  const data = await utils.readExcelFile(req.file.buffer);
  await secDetailModel.insertMany(data);
  res.status(200).json({ message: "File uploaded successfully" });
});

app.post("/api/transaction", upload.single("file"), async (req, res) => {
  const data = await utils.readExcelFile(req.file.buffer);
  await transactionModel.insertMany(data);
  res.status(200).json({ message: "File uploaded successfully" });
});

app.post("/api/secInfo", upload.single("file"), async (req, res) => {
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

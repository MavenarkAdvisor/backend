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
// const transactionModel = require("./model/transactionModel");
// const secInfoModel = require("./model/secInfoModel");

// Enable CORS for all requests
app.use(cors({
  origin: "http://gplank-test-eb-frontend.ap-south-1.elasticbeanstalk.com/"
}));
app.use(express.json());

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
connectDB();

app.post("/download", async (req, res) => {
  let { from, to } = req.body;
  from = new Date(from);
  to = new Date(to);

  console.log(from, to);

  const result = await subsecinfoModel.find(
    {
      SettlementDate: {
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

  const newWorkbook = xlsx.utils.book_new();
  const newWorksheet = xlsx.utils.json_to_sheet(cleanResult);
  xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

  // Save the new workbook
  const outputPath = path.join("uploads", "output.xlsx");
  xlsx.writeFile(newWorkbook, outputPath);

  res.download(outputPath, "output.xlsx", (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to download file" });
    }
    // Clean up the uploaded file and the generated Excel file after download
    fs.unlink(outputPath, () => {});
  });
});

app.post("/subsecinfo", upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
  ]),
  async (req, res) => {
    let { settlement_date, from, to } = req.body;
    settlement_date = new Date(settlement_date);
    from = new Date(from);
    to = new Date(to);

    const valueDate = new Date(settlement_date);
    valueDate.setDate(valueDate.getDate() - 1);

    const file1 = req.files["file1"][0];
    const file2 = req.files["file2"][0];

    const workbook1 = xlsx.read(file1.buffer, { type: "buffer" });
    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    const data1 = xlsx.utils.sheet_to_json(sheet1);

    const workbook2 = xlsx.read(file2.buffer, { type: "buffer" });
    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
    const data2 = xlsx.utils.sheet_to_json(sheet2);

    const data = utils.joinDataArrays(data1, data2, "SecurityCode");

    const calculatedData = await Promise.all(
      data.map(async (item, index) => {
        const YTM = item.CouponRate / 100;

        const SubSecCode = item.SecurityCode + "_" + (YTM * 100).toFixed(2);

        const Interest = item.Interest / 100;

        const Principal = item.Principal / 100;

        const Total = item.Total / 100;

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

    for (let index = 0; index < calculatedData.length; index++) {
      const item = calculatedData[index];

      const prevCFDate = await utils.calculatePrevCFDate(
        item,
        index,
        calculatedData,
        settlement_date
      );
      calculatedData[index].prevCFDate = prevCFDate;

      const StartDateForValue = await utils.calculateStartDateForValue(
        item,
        index,
        calculatedData,
        settlement_date
      );
      calculatedData[index].StartDateForValue = StartDateForValue;
    }

    // Calculate DF
    for (let index = 0; index < calculatedData.length; index++) {
      const item = calculatedData[index];

      const StartDate = await utils.calculateStartDate(
        item,
        index,
        data,
        settlement_date
      );
      calculatedData[index].StartDate = StartDate;

      const DF = await utils.calculateDF(item, index, calculatedData);
      calculatedData[index].DF = parseFloat(DF).toFixed(16);

      const DFForValuation = await utils.calculateDFForValuation(
        item,
        index,
        calculatedData,
        settlement_date
      );
      calculatedData[index].DFForValuation =
        parseFloat(DFForValuation).toFixed(16);

      const PVForValuation = await utils.calculatePVForValuation(
        item,
        settlement_date
      );
      calculatedData[index].PVForValuation = PVForValuation;

      const PV = await utils.calculatePVMOdify(
        item,
        index,
        calculatedData,
        settlement_date
      );
      calculatedData[index].PV = PV;
    }

    await utils.calculateWeightage(calculatedData); // calculating weightage

    for (let index = 0; index < calculatedData.length; index++) {
      const item = calculatedData[index];

      const Tenor = await utils.calculateTenor(
        item,
        index,
        calculatedData,
        settlement_date
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
        Tenor: item.Tenor.toFixed(2),
        MacaulayDuration: item.MacaulayDuration && item.MacaulayDuration,
        RDDays: item.RDDays,
        RDType: item.RDType,
        RecordDate: item.RecordDate,
        StartDate: item.StartDate,
        DF: item.DF,
        PV: item.PV,
      };
    });

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
      data2.map(async (item, index) => {
        const ytm_value = item.CouponRate / 100;

        const subsecCode =
          item.SecurityCode + "_" + (ytm_value * 100).toFixed(2);

        const faceValue = calculatedData.reduce((total, curr) => {
          return curr.SubSecCode === subsecCode &&
            utils.excelToJSDate(curr.Date) > settlement_date
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

          // nip date - filter exact and next larger date [redempltion] from settlement_date [current]

          if (date > settlement_date && item.SubSecCode === subsecCode) {
            if (nipDate < settlement_date) {
              nipDate = date;
            } else if (nipDate > date) {
              nipDate = date;
            }
          }

          // recorddate - filter exact and next larger RecordDate [redempltion] from settlement_date [current]

          if (item.RecordDate) {
            const RecordDate = new Date(item.RecordDate);
            if (date > settlement_date && item.SubSecCode === subsecCode) {
              if (recordDate_date < settlement_date) {
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

          if (settlement_date > recordDate) {
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

          if (date >= settlement_date && item.SubSecCode === subsecCode) {
            if (dcbdate < settlement_date) {
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
          (settlement_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

        let intaccperday_a = (faceValue * CouponRate) / dcb;

        let intaccperday_x = intaccperday_a * intaccperday_daysDiff;

        let intaccperday_y = intaccperday_a * (intaccperday_daysDiff - 1);

        let intaccperday = intaccperday_a + intaccperday_x + intaccperday_y;

        // console.log(intaccperday_a, intaccperday_x, intaccperday_y);
        //------------------------------------------------------

        // Calculating  DirtyPriceForSettlement by sum of all PV -----------------
        const DirtyPriceForSettlement = calculatedData.reduce((total, curr) => {
          return curr.SubSecCode === subsecCode && curr.PV
            ? curr.PV + total
            : total;
        }, 0.0);
        //------------------------------------------------------

        // calculate Int Acc per day for settlement-------------
        const intaccperdayforsettlement_daysDiff =
          (settlement_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

        let intaccperdayforsettlement_a =
          ((faceValue * CouponRate) / dcb) * intaccperdayforsettlement_daysDiff;

        let intaccperdayforsettlement_b =
          (Math.pow(1 + CouponRate, intaccperdayforsettlement_daysDiff / dcb) -
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
          CleanPriceforSettlement = Math.round(CleanPriceforSettlement_a, 4);
        } else {
          CleanPriceforSettlement = Math.round(CleanPriceforSettlement_a, 2);
        }

        //---------------------------------------------------------------

        let Priceper100_percentage =
          (CleanPriceforSettlement / faceValue) * 100;

        // Round the result to 4 decimal places
        const Priceper100 = Math.round(Priceper100_percentage * 10000) / 10000;

        // ---------------------------------------------------------------

        const FaceValueForValuation_valueDate = new Date(settlement_date);
        FaceValueForValuation_valueDate.setDate(
          FaceValueForValuation_valueDate.getDate() - 1
        );

        const FaceValueForValuation = calculatedData.reduce((total, curr) => {
          return curr.SubSecCode === subsecCode &&
            utils.excelToJSDate(curr.Date) > FaceValueForValuation_valueDate
            ? curr.Principal + total
            : total;
        }, 0.0);

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

        const DirtyPriceForValuation = calculatedData.reduce((total, curr) => {
          return curr.SubSecCode === subsecCode && curr.PVForValuation
            ? curr.PVForValuation + total
            : total;
        }, 0.0);

        const PrincipalRedemptionSinceLIP = FaceValueForValuation - faceValue;

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
          CleanPriceforValuation = Math.round(CleanPriceforValuation_a, 4);
        } else {
          CleanPriceforValuation = Math.round(CleanPriceforValuation_a, 2);
        }

        //---------------------------------------------------------

        let PRDPrincipal = 0;
        let PRDPrincipal_date = new Date("0000-01-01");
        let PRDInterest = 0;
        let PRDInterest_date = new Date("0000-01-01");

        for (let index = 0; index < calculatedData.length; index++) {
          const item = calculatedData[index];
          const date = utils.excelToJSDate(item.Date);

          if (settlement_date > recordDate) {
            if (date > settlement_date && item.SubSecCode === subsecCode) {
              if (PRDPrincipal_date < settlement_date) {
                PRDPrincipal_date = date;
                PRDPrincipal = item.Principal;
              } else if (PRDPrincipal_date > date) {
                PRDPrincipal_date = date;
                PRDPrincipal = item.Principal;
              }
            }
          }

          //---------------------------------------------------------------

          if (settlement_date > recordDate) {
            if (date > settlement_date && item.SubSecCode === subsecCode) {
              if (PRDPrincipal_date < settlement_date) {
                PRDInterest_date = date;
                PRDInterest = item.Principal;
              } else if (PRDPrincipal_date > date) {
                PRDInterest_date = date;
                PRDInterest = item.Principal;
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
          SettlementDate: settlement_date,
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

    const newWorkbook = xlsx.utils.book_new();
    const newWorksheet = xlsx.utils.json_to_sheet(result);
    xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

    // Save the new workbook
    const outputPath = path.join("uploads", "output.xlsx");
    xlsx.writeFile(newWorkbook, outputPath);

    res.download(outputPath, "output.xlsx", (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to download file" });
      }
      // Clean up the uploaded file and the generated Excel file after download
      fs.unlink(outputPath, () => {});
    });
  }
);

app.post("/upload", upload.fields([
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
    const { settlement_date } = req.body;
    const data = await utils.readExcelFile(req.file.buffer);

    // Map over the data array and calculate the new field for each item
    const calculatedData = await Promise.all(
      data.map(async (item, index) => {
        const ytm_value = await utils.YTMcalculate(item);
        const prevCFDate = await utils.calculatePrevCFDate(
          item,
          index,
          data,
          settlement_date
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

  console.log("calculatedData: ", calculatedData);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

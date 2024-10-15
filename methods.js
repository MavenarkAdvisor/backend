const utils = require("./utils");

exports.calculateresult = async (
  data2,
  stockmaster,
  calculatedData,
  system_date,
  valueDate
) => {
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
          Math.pow(1 + CouponRate, intaccperday_daysDiff / dcb - 1) * faceValue;

        let intaccperday_c =
          Math.pow(1 + CouponRate, (intaccperday_daysDiff - 1) / dcb - 1) *
          faceValue;

        let intaccperday_d = Math.pow(1 + CouponRate, 1 / dcb - 1) * faceValue;

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
        const DirtyPriceForSettlement = calculatedData.reduce((total, curr) => {
          return curr.SubSecCode === subsecCode && curr.PVForValuation
            ? curr.PVForValuation + total
            : total;
        }, 0.0);
        //------------------------------------------------------

        // calculate Int Acc per day for settlement-------------
        const intaccperdayforsettlement_daysDiff =
          (system_date - lipdateforsettlement) / (1000 * 60 * 60 * 24);

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
        const Priceper100 = Math.round(Priceper100_percentage * 10000) / 10000;

        // ---------------------------------------------------------------

        const FaceValueForValuation_valueDate = new Date(system_date);
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

  return result;
};

exports.calculateYTMStockmaster = async (stockmaster, data) => {
  const BATCH_SIZE = 100; // Define batch size for chunk processing

  // Helper function to process each batch of stockmaster
  const processBatch = (batch) => {
    for (let index = 0; index < batch.length; index++) {
      const item = batch[index];

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
      batch[index].TradeDate = TradeDate;

      SettlementDate = utils.excelToJSDate(SettlementDate);
      batch[index].SettlementDate = SettlementDate;

      let YTM = 0.0;

      // Find the previous YTM if it exists
      const prevYTMobj = stockmaster.find(
        (obj) => SecurityCode === obj.SecurityCode && obj.YTM
      );

      if (prevYTMobj) {
        YTM = prevYTMobj.YTM;
      } else {
        // Filter once per SecurityCode
        let filterarray = data.filter(
          (obj) =>
            obj.SecurityCode === SecurityCode &&
            utils.excelToJSDate(obj.Date) > SettlementDate
        );

        if (InterestPerUnit < 0) {
          filterarray = filterarray.slice(1); // Skip first element if InterestPerUnit is negative
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

        // Limit the loop to a maximum of 100 iterations to prevent infinite loops
        const MAX_ITERATIONS = 100;

        do {
          const InitialYTM = defaultInitialYTM;
          ytmvalues[i].InitialYTM = InitialYTM;
          const YTMdifferential = defaultYTMdifferential;
          ytmvalues[i].YTMdifferential = YTMdifferential;

          // Calculate Present Value and Discount Factor for YTM
          for (let j = 0; j < ytmarray.length; j++) {
            const item = ytmarray[j];

            if (j > 0) {
              const dayDiff =
                (ytmarray[j].Date - ytmarray[j - 1].Date) /
                (1000 * 60 * 60 * 24);
              ytmarray[j].DF =
                item.DCB === ""
                  ? 0
                  : ytmarray[j - 1].DF /
                    Math.pow(1 + InitialYTM, dayDiff / item.DCB);
            }

            ytmarray[j].PV = ytmarray[j].Total * ytmarray[j].DF;
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

          // Recalculate Present Value with Modified YTM
          for (let j = 0; j < ytmarray.length; j++) {
            const item = ytmarray[j];

            if (j > 0) {
              const dayDiff =
                (ytmarray[j].Date - ytmarray[j - 1].Date) /
                (1000 * 60 * 60 * 24);
              ytmarray[j].DF =
                item.DCB === ""
                  ? 0
                  : ytmarray[j - 1].DF /
                    Math.pow(1 + ModifiedYTM, dayDiff / item.DCB);
            }

            ytmarray[j].PV = ytmarray[j].Total * ytmarray[j].DF;
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
          (ytmvalues[i - 1].OldDifference > 0 ||
            ytmvalues[i - 1].NewDifference > 0 ||
            ytmvalues[i - 1].OldDifference < 0 ||
            ytmvalues[i - 1].NewDifference < 0) &&
          i < MAX_ITERATIONS
        );

        if (ytmvalues[i - 1].OldDifference <= 0) {
          YTM = ytmvalues[i - 1].InitialYTM;
        } else if (ytmvalues[i - 1].NewDifference <= 0) {
          YTM = ytmvalues[i - 1].ModifiedYTM;
        }
      }

      batch[index].YTM = YTM;
      const SecuritySubCode = SecurityCode + "_" + (YTM * 100).toFixed(2);
      batch[index].SecuritySubCode = SecuritySubCode;
    }
  };

  // Process stockmaster in chunks to prevent memory overload
  for (let i = 0; i < stockmaster.length; i += BATCH_SIZE) {
    const batch = stockmaster.slice(i, i + BATCH_SIZE);
    processBatch(batch);
  }

  return stockmaster;
};

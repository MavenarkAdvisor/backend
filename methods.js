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

const SumOfTotal = Total.reduce(
  (accumulator, currentValue) => accumulator + currentValue,
  0
);

const OldDifference = Round(SumOfTotal, 4);

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
    return prevYTMDifferential;
  }
};

// ------------------------------------------------------------------------

exports.AdjustedYTMDifferential =
  YTMDifferential * (OldDifference < 0 ? -1 : 1);

// ------------------------------------------------------------------------

exports.ModifiedYTM = InitialYTM + AdjustedYTMDifferential;

// ------------------------------------------------------------------------

// initial DF=1.00 //loop
const DF1 = async () => {
  const prevDF = data[index - 1]?.DF;
  const data =
    prevDF / Math.pow(1 + AdjustedYTMDifferential, (prevDate - date) / dcb);
  return dcb === "" ? 0 : data;
};

const PV1 = Total * DF1;

// exports.OldDifference =
// sum of all pv1

// ------------------------------------------------------------------------

// initial DF=1.00 //loop
const DF2 = async () => {
  const prevDF = data[index - 1]?.DF;
  const data = prevDF / Math.pow(1 + ModifiedYTM, (prevDate - date) / dcb);
  return dcb === "" ? 0 : data;
};

const PV2 = Total * DF2;

// exports.NewDifference =
// sum of all pv2

// ------------------------------------------------------------------------

exports.ChangeInYTM = async () => {
  const signMatch = SIGN(OldDifference) === SIGN(NewDifference);
  return signMatch ? ModifiedYTM - InitialYTM : "NA";
};

// ------------------------------------------------------------------------

exports.ChangeInDiff = async () =>
  ChangeInYTM === "NA" ? "NA" : NewDifference - OldDifference;

// ------------------------------------------------------------------------

exports.RequiredChangeInDiff = async () => {
  return ChangeInYTM === "NA" ? "NA" : OldDifference * -1;
};

// ------------------------------------------------------------------------

exports.RequiredChangeYTM = async () => {
  return ChangeInYTM === "NA"
    ? "NA"
    : isNaN(ChangeInDiff) || ChangeInDiff === 0
      ? 0
      : (ChangeInYTM * RequiredChangeInDiff) / ChangeInDiff;
};

// ------------------------------------------------------------------------

exports.EndYTM = async () => {
  const v1 = ChangeInDiff === 0 ? ModifiedYTM : InitialYTM;
  const v2 =
    ReuiredChangeInYTM === "NA" ? InitialYTM : InitialYTM + ReuiredChangeInYTM;
  return Math.max(v1, v2, -99.9999);
};

// ------------------------------------------------------------------------

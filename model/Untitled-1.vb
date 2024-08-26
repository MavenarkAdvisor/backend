
const SubPositionArr = stockmaster1.filter(
  (item) =>
    item.SettlementDate.toISOString().split("T")[0] === system_date.toISOString().split("T")[0] && 
    item.EventType === "FI_PUR"
);

// Map to retain only the necessary fields
const filteredArr = SubPositionArr.map(item => ({
  ClientCode: item.clientCode,
  Date: item.SettlementDate.toISOString().split("T")[0],
  SecuritySubCode: item.securitySubCode,
  SecurityCode: item.securityCode
}));

// Remove duplicates based on ClientCode and SecuritySubCode
const uniqueSubPositionArr = filteredArr.filter(
  (item, index, self) =>
    index === self.findIndex((t) => (
      t.ClientCode === item.ClientCode && t.SecuritySubCode === item.SecuritySubCode
    ))
);

console.log(uniqueSubPositionArr);

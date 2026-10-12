const { getPool } = require('./db');
(async () => {
  const p1 = await getPool('UCSPONDY');
  const r1 = await p1.request().query("SELECT CategoryId, CategoryCode, CategoryName FROM CategoryMaster WHERE CategoryId = '0f37721c-263d-4e05-95fa-ab3333ed2d7a'");
  console.log('In UCSPONDY:', r1.recordset);

  const p2 = await getPool('UCSKARAIKUDICR');
  const r2 = await p2.request().query("SELECT CategoryId, CategoryCode, CategoryName FROM CategoryMaster WHERE CategoryId = '0f37721c-263d-4e05-95fa-ab3333ed2d7a'");
  console.log('In UCSKARAIKUDICR:', r2.recordset);

  if (r1.recordset.length > 0) {
    await p1.request().query("DELETE FROM CategoryMaster WHERE CategoryId = '0f37721c-263d-4e05-95fa-ab3333ed2d7a'");
    console.log('Deleted from UCSPONDY');
  }
  if (r2.recordset.length > 0) {
    await p2.request().query("DELETE FROM CategoryMaster WHERE CategoryId = '0f37721c-263d-4e05-95fa-ab3333ed2d7a'");
    console.log('Deleted from UCSKARAIKUDICR');
  }
  process.exit(0);
})();

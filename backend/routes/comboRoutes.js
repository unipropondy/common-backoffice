const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// ================= GET PARENT DISHES (ONLY COMBO DISHES) =================
router.get("/parent-dishes", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          DishId,
          DishCode,
          Name,
          IsCombo,
          IsActive
        FROM DishMaster
        WHERE IsActive = 1
        AND IsCombo = 1
        ORDER BY Name
      `);
    console.log("Parent Dishes Count:", result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Parent Dishes Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= POST PARENT DISH (SET ISCOMBO = 1) =================
router.post("/parent-dishes", async (req, res) => {
  try {
    const { DishId } = req.body;
    if (!DishId) {
      return res.status(400).json({ error: "Dish ID is required." });
    }
    const pool = await poolPromise;
    await pool.request()
      .input("DishId", sql.UniqueIdentifier, DishId)
      .query("UPDATE DishMaster SET IsCombo = 1 WHERE DishId = @DishId");
    res.json({ success: true, message: "Dish marked as parent combo successfully" });
  } catch (err) {
    console.error("POST Parent Dish Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= DELETE PARENT DISH (RESET ISCOMBO = 0) =================
router.delete("/parent-dishes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    // Check if there are active groups under it
    const check = await pool.request()
      .input("ParentComboDishId", sql.UniqueIdentifier, id)
      .query("SELECT COUNT(*) as Count FROM ComboGroupMaster WHERE ParentComboDishId = @ParentComboDishId");
    
    if (check.recordset[0].Count > 0) {
      return res.status(400).json({ error: "Cannot remove parent combo because it has active combo groups." });
    }
    await pool.request()
      .input("DishId", sql.UniqueIdentifier, id)
      .query("UPDATE DishMaster SET IsCombo = 0 WHERE DishId = @DishId");
    res.json({ success: true, message: "Dish unmarked as parent combo successfully" });
  } catch (err) {
    console.error("DELETE Parent Dish Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET AVAILABLE DISHES (ONLY NON-COMBO DISHES) =================
router.get("/available-dishes", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          DishId,
          DishCode,
          Name,
          IsCombo,
          IsActive
        FROM DishMaster
        WHERE IsActive = 1
        AND IsCombo = 0
        ORDER BY Name
      `);
    console.log("Available Dishes Count:", result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Available Dishes Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET ALL COMBO GROUPS =================
router.get("/groups", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          cgm.ComboGroupId,
          COALESCE(pdcgm.ParentDishId, cgm.ParentComboDishId) AS ParentComboDishId,
          cgm.GroupName,
          cgm.DisplayOrder,
          cgm.MinSelection,
          cgm.MaxSelection,
          cgm.IsMultiSelect,
          cgm.IsActive,
          cgm.CreatedOn,
          dm.DishCode as ParentDishCode,
          dm.Name as ParentDishName
        FROM ComboGroupMaster cgm
        LEFT JOIN ParentDishComboGroupMapping pdcgm ON cgm.ComboGroupId = pdcgm.ComboGroupId
        LEFT JOIN DishMaster dm ON COALESCE(pdcgm.ParentDishId, cgm.ParentComboDishId) = dm.DishId
        WHERE cgm.IsActive = 1
        ORDER BY cgm.DisplayOrder, cgm.GroupName
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Combo Groups Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET COMBO GROUP BY ID =================
router.get("/groups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("ComboGroupId", sql.UniqueIdentifier, id)
      .query(`
        SELECT
          ComboGroupId,
          ParentComboDishId,
          GroupName,
          DisplayOrder,
          MinSelection,
          MaxSelection,
          IsMultiSelect,
          IsActive,
          CreatedOn
        FROM ComboGroupMaster
        WHERE ComboGroupId = @ComboGroupId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Combo group not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("GET Combo Group By ID Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= INSERT COMBO GROUP =================
router.post("/groups", async (req, res) => {
  try {
    console.log("Received form data:", req.body);
   
    const {
      ParentComboDishId,
      GroupName,
      DisplayOrder = 0,
      MinSelection = 1,
      MaxSelection = 1,
      IsMultiSelect = false,
      IsActive = true
    } = req.body;

    // Validate inputs
    if (!GroupName || !GroupName.trim()) {
      console.error("Validation Error: Group name is required.");
      return res.status(400).json({ error: "Group name is required." });
    }
    if (!ParentComboDishId) {
      console.error("Validation Error: Parent combo dish is required.");
      return res.status(400).json({ error: "Parent combo dish is required." });
    }

    console.log("ParentComboDishId:", ParentComboDishId);
    console.log("GroupName:", GroupName);
    console.log("DisplayOrder:", DisplayOrder);
    console.log("MinSelection:", MinSelection);
    console.log("MaxSelection:", MaxSelection);
    console.log("IsMultiSelect:", IsMultiSelect);
    console.log("IsActive:", IsActive);

    const pool = await poolPromise;
   
    // Generate new GUID
    const newComboGroupId = require('crypto').randomUUID();
    console.log("Generated ComboGroupId:", newComboGroupId);

    // Use a transaction to ensure group and mapping are both created
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction.request()
        .input("ComboGroupId", sql.UniqueIdentifier, newComboGroupId)
        .input("ParentComboDishId", sql.UniqueIdentifier, ParentComboDishId)
        .input("GroupName", sql.NVarChar, GroupName.trim())
        .input("DisplayOrder", sql.Int, DisplayOrder)
        .input("MinSelection", sql.Int, MinSelection)
        .input("MaxSelection", sql.Int, MaxSelection)
        .input("IsMultiSelect", sql.Bit, IsMultiSelect ? 1 : 0)
        .input("IsActive", sql.Bit, IsActive ? 1 : 0)
        .query(`
          INSERT INTO ComboGroupMaster (
            ComboGroupId, ParentComboDishId, GroupName,
            DisplayOrder, MinSelection, MaxSelection,
            IsMultiSelect, IsActive, CreatedOn
          )
          VALUES (
            @ComboGroupId, @ParentComboDishId, @GroupName,
            @DisplayOrder, @MinSelection, @MaxSelection,
            @IsMultiSelect, @IsActive, GETDATE()
          )
        `);

      await transaction.request()
        .input("ParentDishId", sql.UniqueIdentifier, ParentComboDishId)
        .input("ComboGroupId", sql.UniqueIdentifier, newComboGroupId)
        .query(`
          INSERT INTO ParentDishComboGroupMapping (ParentDishId, ComboGroupId)
          VALUES (@ParentDishId, @ComboGroupId)
        `);

      await transaction.request()
        .input("DishId", sql.UniqueIdentifier, ParentComboDishId)
        .query(`
          UPDATE DishMaster
          SET IsCombo = 1
          WHERE DishId = @DishId
        `);

      await transaction.commit();
      console.log("Combo group created successfully:", newComboGroupId);

      res.json({
        success: true,
        message: "Combo group created successfully",
        ComboGroupId: newComboGroupId
      });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error("INSERT Combo Group Error:", err);
    res.status(500).json({ error: "Insert Error: " + err.message });
  }
});

// ================= UPDATE COMBO GROUP =================
router.put("/groups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ParentComboDishId,
      GroupName,
      DisplayOrder,
      MinSelection,
      MaxSelection,
      IsMultiSelect,
      IsActive
    } = req.body;

    if (!GroupName || !GroupName.trim()) {
      return res.status(400).json({ error: "Group name is required." });
    }
    if (!ParentComboDishId) {
      return res.status(400).json({ error: "Parent combo dish is required." });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("ComboGroupId", sql.UniqueIdentifier, id)
      .input("ParentComboDishId", sql.UniqueIdentifier, ParentComboDishId)
      .input("GroupName", sql.NVarChar, GroupName.trim())
      .input("DisplayOrder", sql.Int, DisplayOrder || 0)
      .input("MinSelection", sql.Int, MinSelection || 1)
      .input("MaxSelection", sql.Int, MaxSelection || 1)
      .input("IsMultiSelect", sql.Bit, IsMultiSelect ? 1 : 0)
      .input("IsActive", sql.Bit, IsActive ? 1 : 0)
      .query(`
        UPDATE ComboGroupMaster
        SET
          ParentComboDishId = @ParentComboDishId,
          GroupName = @GroupName,
          DisplayOrder = @DisplayOrder,
          MinSelection = @MinSelection,
          MaxSelection = @MaxSelection,
          IsMultiSelect = @IsMultiSelect,
          IsActive = @IsActive
        WHERE ComboGroupId = @ComboGroupId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Combo group not found" });
    }

    res.json({ success: true, message: "Combo group updated successfully" });
  } catch (err) {
    console.error("UPDATE Combo Group Error:", err);
    res.status(500).json({ error: "Update Error" });
  }
});

// ================= DELETE COMBO GROUP =================
router.delete("/groups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
   
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Delete mappings first (foreign key constraint)
      await transaction.request()
        .input("ComboGroupId", sql.UniqueIdentifier, id)
        .query("DELETE FROM ComboGroupDishMapping WHERE ComboGroupId = @ComboGroupId");

      // Delete parent mappings
      await transaction.request()
        .input("ComboGroupId", sql.UniqueIdentifier, id)
        .query("DELETE FROM ParentDishComboGroupMapping WHERE ComboGroupId = @ComboGroupId");

      // Delete the group
      const result = await transaction.request()
        .input("ComboGroupId", sql.UniqueIdentifier, id)
        .query("DELETE FROM ComboGroupMaster WHERE ComboGroupId = @ComboGroupId");

      if (result.rowsAffected[0] === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Combo group not found" });
      }

      await transaction.commit();
      res.json({ success: true, message: "Combo group deleted successfully" });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error("DELETE Combo Group Error:", err);
    res.status(500).json({ error: "Delete Error" });
  }
});

// ================= GET PARENT DISHES FOR A COMBO GROUP =================
router.get("/groups/:id/parents", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("ComboGroupId", sql.UniqueIdentifier, id)
      .query(`
        SELECT ParentDishId FROM ParentDishComboGroupMapping
        WHERE ComboGroupId = @ComboGroupId
      `);
    res.json(result.recordset.map(row => row.ParentDishId));
  } catch (err) {
    console.error("GET Combo Group Parents Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= ASSIGN PARENT DISHES TO A COMBO GROUP =================
router.post("/groups/:id/parents", async (req, res) => {
  try {
    const { id } = req.params;
    const { ParentDishIds } = req.body;

    if (!Array.isArray(ParentDishIds)) {
      return res.status(400).json({ error: "ParentDishIds must be an array." });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Delete all existing mappings for this group
      await transaction.request()
        .input("ComboGroupId", sql.UniqueIdentifier, id)
        .query("DELETE FROM ParentDishComboGroupMapping WHERE ComboGroupId = @ComboGroupId");

      // 2. Insert new mappings
      for (const parentId of ParentDishIds) {
        await transaction.request()
          .input("ParentDishId", sql.UniqueIdentifier, parentId)
          .input("ComboGroupId", sql.UniqueIdentifier, id)
          .query(`
            INSERT INTO ParentDishComboGroupMapping (ParentDishId, ComboGroupId)
            VALUES (@ParentDishId, @ComboGroupId)
          `);
      }

      await transaction.commit();
      res.json({ success: true, message: "Parent dishes assigned successfully." });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error("POST Assign Parents Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ================= GET DISH MAPPINGS =================
router.get("/mappings", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          cgm.MappingId,
          cgm.ComboGroupId,
          cgm.DishId,
          cgm.Surcharge,
          cgm.IsDefault,
          cgm.SortOrder,
          cgm.StoreId,
          cgm.IsActive,
          cgm.CreatedOn,
          dm.DishCode as DishCode,
          dm.Name as DishName
        FROM ComboGroupDishMapping cgm
        LEFT JOIN DishMaster dm ON cgm.DishId = dm.DishId
        ORDER BY cgm.SortOrder, dm.Name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Mappings Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= GET DISH MAPPINGS BY GROUP =================
router.get("/mappings/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("ComboGroupId", sql.UniqueIdentifier, groupId)
      .query(`
        SELECT
          cgm.MappingId,
          cgm.ComboGroupId,
          cgm.DishId,
          cgm.Surcharge,
          cgm.IsDefault,
          cgm.SortOrder,
          cgm.StoreId,
          cgm.IsActive,
          cgm.CreatedOn,
          dm.DishCode as DishCode,
          dm.Name as DishName,
          dm.IsCombo
        FROM ComboGroupDishMapping cgm
        LEFT JOIN DishMaster dm ON cgm.DishId = dm.DishId
        WHERE cgm.ComboGroupId = @ComboGroupId
        ORDER BY cgm.SortOrder, dm.Name
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("GET Mappings By Group Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ================= INSERT DISH MAPPING =================
router.post("/mappings", async (req, res) => {
  try {
    console.log("Received mapping data:", req.body);
    
    const {
      ComboGroupId,
      DishId,
      Surcharge = 0.00,
      IsDefault = false,
      SortOrder = 0,
      StoreId = null,
      IsActive = true
    } = req.body;

    // Validate required fields
    if (!ComboGroupId) {
      console.error("Validation Error: Combo group ID is required.");
      return res.status(400).json({ error: "Combo group ID is required." });
    }
    if (!DishId) {
      console.error("Validation Error: Dish ID is required.");
      return res.status(400).json({ error: "Dish ID is required." });
    }

    const pool = await poolPromise;
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if the dish is already mapped to this group
      const checkResult = await transaction.request()
        .input("ComboGroupId", sql.UniqueIdentifier, ComboGroupId)
        .input("DishId", sql.UniqueIdentifier, DishId)
        .query(`
          SELECT COUNT(*) as Count
          FROM ComboGroupDishMapping
          WHERE ComboGroupId = @ComboGroupId AND DishId = @DishId AND IsActive = 1
        `);

      if (checkResult.recordset[0].Count > 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "This dish is already mapped to this group." });
      }

      // Generate new GUID for mapping
      const newMappingId = require('crypto').randomUUID();
      console.log("Generated MappingId:", newMappingId);

      // Insert the mapping
      await transaction.request()
        .input("MappingId", sql.UniqueIdentifier, newMappingId)
        .input("ComboGroupId", sql.UniqueIdentifier, ComboGroupId)
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("Surcharge", sql.Decimal(10, 2), parseFloat(Surcharge) || 0)
        .input("IsDefault", sql.Bit, IsDefault ? 1 : 0)
        .input("SortOrder", sql.Int, parseInt(SortOrder) || 0)
        .input("StoreId", sql.UniqueIdentifier, StoreId)
        .input("IsActive", sql.Bit, IsActive ? 1 : 0)
        .query(`
          INSERT INTO ComboGroupDishMapping (
            MappingId, 
            ComboGroupId, 
            DishId,
            Surcharge, 
            IsDefault, 
            SortOrder,
            StoreId, 
            IsActive, 
            CreatedOn
          )
          VALUES (
            @MappingId, 
            @ComboGroupId, 
            @DishId,
            @Surcharge, 
            @IsDefault, 
            @SortOrder,
            @StoreId, 
            @IsActive, 
            GETDATE()
          )
        `);
      await transaction.commit();
      console.log("Dish mapping created successfully:", newMappingId);

      res.json({
        success: true,
        message: "Dish mapping created successfully",
        MappingId: newMappingId
      });
    } catch (err) {
      console.error("Transaction Error:", err);
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("INSERT Mapping Error:", err);
    res.status(500).json({ error: "Insert Error: " + err.message });
  }
});

// ================= BATCH INSERT DISH MAPPINGS =================
router.post("/mappings/batch", async (req, res) => {
  try {
    const {
      ComboGroupId,
      DishIds,
      Surcharge = 0.00,
      IsDefault = false,
      SortOrder = 0,
      StoreId = null,
      IsActive = true
    } = req.body;

    if (!ComboGroupId) {
      return res.status(400).json({ error: "Combo group ID is required." });
    }
    if (!DishIds || !Array.isArray(DishIds) || DishIds.length === 0) {
      return res.status(400).json({ error: "Dish IDs array is required and cannot be empty." });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const addedMappings = [];

      for (const dishId of DishIds) {
        const checkResult = await transaction.request()
          .input("ComboGroupId", sql.UniqueIdentifier, ComboGroupId)
          .input("DishId", sql.UniqueIdentifier, dishId)
          .query(`
            SELECT COUNT(*) as Count
            FROM ComboGroupDishMapping
            WHERE ComboGroupId = @ComboGroupId AND DishId = @DishId AND IsActive = 1
          `);

        if (checkResult.recordset[0].Count > 0) {
          continue;
        }

        const newMappingId = require('crypto').randomUUID();

        await transaction.request()
          .input("MappingId", sql.UniqueIdentifier, newMappingId)
          .input("ComboGroupId", sql.UniqueIdentifier, ComboGroupId)
          .input("DishId", sql.UniqueIdentifier, dishId)
          .input("Surcharge", sql.Decimal(10, 2), parseFloat(Surcharge) || 0)
          .input("IsDefault", sql.Bit, IsDefault ? 1 : 0)
          .input("SortOrder", sql.Int, parseInt(SortOrder) || 0)
          .input("StoreId", sql.UniqueIdentifier, StoreId)
          .input("IsActive", sql.Bit, IsActive ? 1 : 0)
          .query(`
            INSERT INTO ComboGroupDishMapping (
              MappingId, ComboGroupId, DishId,
              Surcharge, IsDefault, SortOrder,
              StoreId, IsActive, CreatedOn
            )
            VALUES (
              @MappingId, @ComboGroupId, @DishId,
              @Surcharge, @IsDefault, @SortOrder,
              @StoreId, @IsActive, GETDATE()
            )
          `);

        addedMappings.push(newMappingId);
      }

      await transaction.commit();
      res.json({
        success: true,
        message: `Successfully mapped ${addedMappings.length} dishes.`,
        MappingIds: addedMappings
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("BATCH INSERT Mapping Error:", err);
    res.status(500).json({ error: "Batch Insert Error: " + err.message });
  }
});

// ================= UPDATE DISH MAPPING =================
router.put("/mappings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      DishId,
      Surcharge,
      IsDefault,
      SortOrder,
      StoreId,
      IsActive
    } = req.body;

    console.log("Updating mapping:", { id, ...req.body });

    if (!DishId) {
      return res.status(400).json({ error: "Dish ID is required." });
    }

    const pool = await poolPromise;
    
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if mapping exists and get the old DishId
      const checkResult = await transaction.request()
        .input("MappingId", sql.UniqueIdentifier, id)
        .query(`
          SELECT DishId FROM ComboGroupDishMapping
          WHERE MappingId = @MappingId
        `);

      if (checkResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Dish mapping not found" });
      }

      const oldDishId = checkResult.recordset[0].DishId;

      // Update the mapping
      await transaction.request()
        .input("MappingId", sql.UniqueIdentifier, id)
        .input("DishId", sql.UniqueIdentifier, DishId)
        .input("Surcharge", sql.Decimal(10, 2), parseFloat(Surcharge) || 0.00)
        .input("IsDefault", sql.Bit, IsDefault ? 1 : 0)
        .input("SortOrder", sql.Int, parseInt(SortOrder) || 0)
        .input("StoreId", sql.UniqueIdentifier, StoreId || null)
        .input("IsActive", sql.Bit, IsActive ? 1 : 0)
        .query(`
          UPDATE ComboGroupDishMapping
          SET
            DishId = @DishId,
            Surcharge = @Surcharge,
            IsDefault = @IsDefault,
            SortOrder = @SortOrder,
            StoreId = @StoreId,
            IsActive = @IsActive
          WHERE MappingId = @MappingId
        `);

      await transaction.commit();
      console.log("Dish mapping updated successfully:", id);

      res.json({ 
        success: true, 
        message: "Dish mapping updated successfully" 
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("UPDATE Mapping Error:", err);
    res.status(500).json({ error: "Update Error: " + err.message });
  }
});

// ================= DELETE DISH MAPPING =================
router.delete("/mappings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
   
    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Get the DishId before deleting
      const getDishResult = await transaction.request()
        .input("MappingId", sql.UniqueIdentifier, id)
        .query(`
          SELECT DishId FROM ComboGroupDishMapping
          WHERE MappingId = @MappingId
        `);

      if (getDishResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Dish mapping not found" });
      }

      const dishId = getDishResult.recordset[0].DishId;

      // Delete the mapping
      await transaction.request()
        .input("MappingId", sql.UniqueIdentifier, id)
        .query("DELETE FROM ComboGroupDishMapping WHERE MappingId = @MappingId");

      await transaction.commit();
      res.json({ success: true, message: "Dish mapping deleted successfully" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("DELETE Mapping Error:", err);
    res.status(500).json({ error: "Delete Error: " + err.message });
  }
});

module.exports = router;
import { BASE_URL } from "../config/config";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaTrash, FaEdit, FaPlus, FaCheck, FaFolder, FaUtensils, FaArrowRight, FaChevronDown, FaChevronRight } from "react-icons/fa";
import "./ComboGroupMaster.css";

function ComboGroupMaster({ sidebarOpen }) {
  // Data State
  const [parentDishes, setParentDishes] = useState([]);
  const [comboGroups, setComboGroups] = useState([]);
  const [dishMappings, setDishMappings] = useState([]);
  const [availableDishes, setAvailableDishes] = useState([]);
  
  // Selection State
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  
  // UI & Loading State
  const [expandedParents, setExpandedParents] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");

  // Modals
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showAssignParentModal, setShowAssignParentModal] = useState(false);
  const [assignedParentIds, setAssignedParentIds] = useState([]);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  
  // Parent Combo Add State
  const [selectedNewParentDishId, setSelectedNewParentDishId] = useState("");
  const [parentSearchSelect, setParentSearchSelect] = useState("");
  const [showParentSelectDropdown, setShowParentSelectDropdown] = useState(false);

  // Batch Add State
  const [selectedAvailableDishIds, setSelectedAvailableDishIds] = useState([]);
  const [batchSurcharge, setBatchSurcharge] = useState(0.00);
  const [batchSortOrder, setBatchSortOrder] = useState(0);

  // Form State - Group
  const [groupForm, setGroupForm] = useState({
    ComboGroupId: "",
    ParentComboDishId: "",
    GroupName: "",
    DisplayOrder: 0,
    MinSelection: 1,
    MaxSelection: 1,
    IsMultiSelect: false,
    IsActive: true
  });

  // Form State - Mapping (for single edits)
  const [mappingForm, setMappingForm] = useState({
    MappingId: "",
    ComboGroupId: "",
    DishId: "",
    Surcharge: 0.00,
    IsDefault: false,
    SortOrder: 0,
    IsActive: true
  });

  // ================= FETCH DATA =================
  const fetchParentDishes = useCallback(async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/combo/parent-dishes");
      setParentDishes(res.data || []);
    } catch (err) {
      console.error("Fetch Parent Dishes Error:", err);
    }
  }, []);

  const fetchComboGroups = useCallback(async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/combo/groups");
      setComboGroups(res.data || []);
    } catch (err) {
      console.error("Fetch Combo Groups Error:", err);
    }
  }, []);

  const fetchAvailableDishes = useCallback(async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/combo/available-dishes");
      setAvailableDishes(res.data || []);
    } catch (err) {
      console.error("Fetch Available Dishes Error:", err);
    }
  }, []);

  const fetchDishMappings = useCallback(async (groupId) => {
    if (!groupId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/combo/mappings/${groupId}`);
      setDishMappings(res.data || []);
    } catch (err) {
      console.error("Fetch Mappings Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchParentDishes();
    fetchComboGroups();
    fetchAvailableDishes();
  }, [fetchParentDishes, fetchComboGroups, fetchAvailableDishes]);

  // Sync mappings when group selection changes
  useEffect(() => {
    if (selectedGroupId) {
      fetchDishMappings(selectedGroupId);
    } else {
      setDishMappings([]);
    }
    // Clear batch selection on group change
    setSelectedAvailableDishIds([]);
  }, [selectedGroupId, fetchDishMappings]);

  // Set default selection on load
  useEffect(() => {
    if (parentDishes.length > 0 && !selectedParentId) {
      setSelectedParentId(parentDishes[0].DishId);
      // Auto expand the first parent
      setExpandedParents(prev => ({ ...prev, [parentDishes[0].DishId]: true }));
    }
  }, [parentDishes, selectedParentId]);

  // Set default group when parent selection changes
  useEffect(() => {
    if (selectedParentId) {
      const groupsForParent = comboGroups.filter(g => g.ParentComboDishId === selectedParentId);
      if (groupsForParent.length > 0) {
        setSelectedGroupId(groupsForParent[0].ComboGroupId);
      } else {
        setSelectedGroupId(null);
      }
    }
  }, [selectedParentId, comboGroups]);

  // ================= PARENT COMBO MANAGEMENT =================
  const handleSaveParentCombo = async () => {
    if (!selectedNewParentDishId) {
      alert("Please select a dish to set as parent combo.");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/api/combo/parent-dishes`, { DishId: selectedNewParentDishId });
      setShowParentModal(false);
      setSelectedNewParentDishId("");
      setParentSearchSelect("");
      await fetchParentDishes();
      await fetchAvailableDishes();
      alert("Parent combo added successfully!");
    } catch (err) {
      console.error("Save Parent Error:", err);
      alert("Failed to add parent combo.");
    }
  };

  const handleDeleteParentCombo = async (id) => {
    if (window.confirm("Are you sure you want to unmark this dish as a Parent Combo?")) {
      try {
        await axios.delete(`${BASE_URL}/api/combo/parent-dishes/${id}`);
        if (selectedParentId === id) {
          setSelectedParentId(null);
          setSelectedGroupId(null);
        }
        await fetchParentDishes();
        await fetchAvailableDishes();
      } catch (err) {
        console.error("Delete Parent Combo Error:", err.response?.data?.error || err.message);
        alert(err.response?.data?.error || "Failed to remove parent combo status.");
      }
    }
  };

  // ================= GROUP MANAGEMENT =================
  const openGroupModal = (group = null) => {
    if (group) {
      setGroupForm({
        ComboGroupId: group.ComboGroupId,
        ParentComboDishId: group.ParentComboDishId,
        GroupName: group.GroupName,
        DisplayOrder: group.DisplayOrder || 0,
        MinSelection: group.MinSelection || 1,
        MaxSelection: group.MaxSelection || 1,
        IsMultiSelect: group.IsMultiSelect === true || group.IsMultiSelect === 1,
        IsActive: group.IsActive === true || group.IsActive === 1
      });
    } else {
      setGroupForm({
        ComboGroupId: "",
        ParentComboDishId: selectedParentId || "",
        GroupName: "",
        DisplayOrder: 0,
        MinSelection: 1,
        MaxSelection: 1,
        IsMultiSelect: false,
        IsActive: true
      });
    }
    setShowGroupModal(true);
  };

  const handleSaveGroup = async () => {
    if (!groupForm.GroupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    if (!groupForm.ParentComboDishId) {
      alert("Please select a parent combo dish.");
      return;
    }

    try {
      if (groupForm.ComboGroupId) {
        await axios.put(`${BASE_URL}/api/combo/groups/${groupForm.ComboGroupId}`, groupForm);
      } else {
        const res = await axios.post(BASE_URL + "/api/combo/groups", groupForm);
        if (res.data && res.data.ComboGroupId) {
          setSelectedGroupId(res.data.ComboGroupId);
        }
      }
      setShowGroupModal(false);
      await fetchComboGroups();
      await fetchParentDishes();
    } catch (err) {
      console.error("Save Group Error:", err);
      alert("Failed to save combo group.");
    }
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm("Are you sure you want to delete this group and all its mappings?")) {
      try {
        await axios.delete(`${BASE_URL}/api/combo/groups/${id}`);
        setSelectedGroupId(null);
        await fetchComboGroups();
        await fetchParentDishes();
        setShowGroupModal(false);
      } catch (err) {
        console.error("Delete Group Error:", err);
        alert("Failed to delete combo group.");
      }
    }
  };

  const handleRemoveParentMapping = async (parentId, groupId, groupName) => {
    if (window.confirm(`Are you sure you want to remove the combo group "${groupName}" from this parent dish?`)) {
      try {
        const res = await axios.get(`${BASE_URL}/api/combo/groups/${groupId}/parents`);
        const currentParents = res.data || [];
        const updatedParents = currentParents.filter(id => id !== parentId);
        
        await axios.post(`${BASE_URL}/api/combo/groups/${groupId}/parents`, {
          ParentDishIds: updatedParents
        });
        
        if (selectedGroupId === groupId && selectedParentId === parentId) {
          setSelectedGroupId(null);
        }
        await fetchComboGroups();
        alert("Removed assignment successfully!");
      } catch (err) {
        console.error("Remove parent mapping error:", err);
        alert("Failed to remove assignment.");
      }
    }
  };

  // ================= SINGLE MAPPING EDIT/DELETE =================
  const openMappingModal = (mapping) => {
    setMappingForm({
      MappingId: mapping.MappingId,
      ComboGroupId: mapping.ComboGroupId,
      DishId: mapping.DishId,
      Surcharge: mapping.Surcharge,
      IsDefault: mapping.IsDefault === true || mapping.IsDefault === 1,
      SortOrder: mapping.SortOrder || 0,
      IsActive: mapping.IsActive === true || mapping.IsActive === 1
    });
    setShowMappingModal(true);
  };

  const handleSaveMapping = async () => {
    try {
      await axios.put(`${BASE_URL}/api/combo/mappings/${mappingForm.MappingId}`, mappingForm);
      setShowMappingModal(false);
      fetchDishMappings(selectedGroupId);
    } catch (err) {
      console.error("Save Mapping Error:", err);
      alert("Failed to update dish mapping.");
    }
  };

  const handleDeleteMapping = async (id) => {
    if (window.confirm("Are you sure you want to remove this dish mapping?")) {
      try {
        await axios.delete(`${BASE_URL}/api/combo/mappings/${id}`);
        fetchDishMappings(selectedGroupId);
      } catch (err) {
        console.error("Delete Mapping Error:", err);
        alert("Failed to delete mapping.");
      }
    }
  };

  // ================= BATCH ADD MAPPINGS =================
  const handleBatchAdd = async () => {
    if (selectedAvailableDishIds.length === 0) {
      alert("Please select at least one dish to map.");
      return;
    }
    try {
      const response = await axios.post(`${BASE_URL}/api/combo/mappings/batch`, {
        ComboGroupId: selectedGroupId,
        DishIds: selectedAvailableDishIds,
        Surcharge: batchSurcharge,
        SortOrder: batchSortOrder,
        IsDefault: false,
        IsActive: true
      });

      if (response.data && response.data.success) {
        // Refresh mapping list
        await fetchDishMappings(selectedGroupId);
        // Clear selection
        setSelectedAvailableDishIds([]);
        setBatchSurcharge(0.00);
        setBatchSortOrder(0);
        setShowBatchModal(false);
        alert(`Successfully added ${response.data.MappingIds.length} dishes to the group!`);
      }
    } catch (err) {
      console.error("Batch Add Error:", err);
      alert("Failed to map selected dishes.");
    }
  };

  const toggleSelectAvailableDish = (dishId) => {
    setSelectedAvailableDishIds(prev =>
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const toggleExpandParent = (parentId) => {
    setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  const openAssignParentModal = async () => {
    if (!selectedGroupId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/combo/groups/${selectedGroupId}/parents`);
      setAssignedParentIds(res.data || []);
      setParentSearchQuery("");
      setShowAssignParentModal(true);
    } catch (err) {
      console.error("Fetch Assigned Parents Error:", err);
      alert("Failed to load assigned parents.");
    }
  };

  const handleSaveAssignedParents = async () => {
    try {
      await axios.post(`${BASE_URL}/api/combo/groups/${selectedGroupId}/parents`, {
        ParentDishIds: assignedParentIds
      });
      setShowAssignParentModal(false);
      await fetchComboGroups(); // Refresh tree view/groups
      alert("Parent dishes assigned successfully!");
    } catch (err) {
      console.error("Save Assigned Parents Error:", err);
      alert("Failed to assign parent dishes.");
    }
  };

  const toggleParentAssignment = (parentId) => {
    setAssignedParentIds(prev =>
      prev.includes(parentId)
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    );
  };

  // Filters
  const filteredParents = parentDishes.filter(dish =>
    dish.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dish.DishCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableDishes = availableDishes.filter(dish => {
    // Exclude already mapped dishes in the current group
    const isAlreadyMapped = dishMappings.some(m => m.DishId === dish.DishId);
    if (isAlreadyMapped) return false;

    return (
      dish.Name?.toLowerCase().includes(availableSearch.toLowerCase()) ||
      dish.DishCode?.toLowerCase().includes(availableSearch.toLowerCase())
    );
  });

  const getFilteredDishesForParentAdd = () => {
    return availableDishes.filter(dish => 
      dish.Name?.toLowerCase().includes(parentSearchSelect.toLowerCase()) ||
      dish.DishCode?.toLowerCase().includes(parentSearchSelect.toLowerCase())
    );
  };

  const selectedParent = parentDishes.find(p => p.DishId === selectedParentId);
  const selectedGroup = comboGroups.find(g => g.ComboGroupId === selectedGroupId);

  return (
    <div className={`combogroup-viewport ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="combogroup-layout">
        
        {/* LEFT COLUMN: PARENT COMBOS & GROUPS TREE */}
        <div className="combogroup-sidebar">
          <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Parent Combos</h3>
              <button 
                className="btn-save" 
                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  fetchAvailableDishes();
                  setShowParentModal(true);
                }}
              >
                <FaPlus /> Add Parent
              </button>
            </div>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search parent combos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tree-container">
            {filteredParents.map(parent => {
              const isExpanded = expandedParents[parent.DishId];
              const isSelected = selectedParentId === parent.DishId;
              const groups = comboGroups.filter(g => g.ParentComboDishId === parent.DishId);

              return (
                <div key={parent.DishId} className={`tree-node ${isSelected ? "selected" : ""}`}>
                  <div 
                    className="tree-node-parent" 
                    onClick={() => {
                      setSelectedParentId(parent.DishId);
                      toggleExpandParent(parent.DishId);
                    }}
                    style={{ position: 'relative' }}
                  >
                    <span className="expand-icon">
                      {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                    <FaUtensils className="utensils-icon" />
                    <div className="parent-info">
                      <div className="parent-name">{parent.Name}</div>
                      <div className="parent-code">{parent.DishCode}</div>
                    </div>
                    {/* Delete Parent Combo button */}
                    <button 
                      className="icon-btn delete-parent-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteParentCombo(parent.DishId);
                      }}
                      title="Remove Parent Combo status"
                      style={{ padding: '2px', color: '#e74c3c', marginRight: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <FaTrash style={{ fontSize: '10px' }} />
                    </button>
                    <span className="group-badge">{groups.length}</span>
                  </div>

                  {isExpanded && (
                    <div className="tree-node-children">
                      {groups.map(group => (
                        <div 
                          key={group.ComboGroupId} 
                          className={`child-group-item ${selectedGroupId === group.ComboGroupId ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParentId(parent.DishId);
                            setSelectedGroupId(group.ComboGroupId);
                          }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FaFolder className="folder-icon" />
                            <span>{group.GroupName}</span>
                          </div>
                          {/* Delete Group Tree Button */}
                          <button 
                            className="delete-group-tree-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveParentMapping(parent.DishId, group.ComboGroupId, group.GroupName);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.7, cursor: 'pointer', padding: 0 }}
                          >
                            <FaTrash style={{ fontSize: '9px' }} />
                          </button>
                        </div>
                      ))}
                      <button 
                        className="add-group-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParentId(parent.DishId);
                          openGroupModal();
                        }}
                      >
                        <FaPlus /> New Group
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: GROUP DETAILS & DISH MAPPINGS */}
        <div className="combogroup-main">
          {selectedGroup ? (
            <div className="group-detail-view">
              
              {/* TOP HEADER */}
              <div className="main-detail-header">
                <div>
                  <div className="parent-combo-breadcrumb">
                    {selectedParent?.Name} <FaArrowRight /> {selectedGroup.GroupName}
                  </div>
                  <h2>{selectedGroup.GroupName}</h2>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-edit-group" onClick={() => openGroupModal(selectedGroup)}>
                    <FaEdit /> Edit Group
                  </button>
                  <button className="btn-assign-parent" onClick={openAssignParentModal}>
                    <FaPlus /> Assign Parent
                  </button>
                  <button 
                    className="btn-delete" 
                    style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleDeleteGroup(selectedGroup.ComboGroupId)}
                  >
                    <FaTrash /> Delete Group
                  </button>
                </div>
              </div>

              {/* STATS / SETTINGS BAR */}
              <div className="settings-summary-bar">
                <div className="summary-card">
                  <div className="label">Min Selection</div>
                  <div className="value">{selectedGroup.MinSelection}</div>
                </div>
                <div className="summary-card">
                  <div className="label">Max Selection</div>
                  <div className="value">{selectedGroup.MaxSelection}</div>
                </div>
                <div className="summary-card">
                  <div className="label">Multi Select</div>
                  <div className="value">{selectedGroup.IsMultiSelect ? "Yes" : "No"}</div>
                </div>
                <div className="summary-card">
                  <div className="label">Display Order</div>
                  <div className="value">{selectedGroup.DisplayOrder}</div>
                </div>
                <div className="summary-card">
                  <div className="label">Mapped Dishes</div>
                  <div className="value">{dishMappings.length}</div>
                </div>
              </div>

              {/* MAPPINGS WORKSPACE */}
              <div className="mappings-workspace" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '20px' }}>
                
                {/* CURRENT MAPPINGS LIST */}
                <div className="current-mappings-panel" style={{ borderRight: 'none', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>Mapped Dishes ({dishMappings.length})</h4>
                    <button 
                      className="btn-save" 
                      style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        fetchAvailableDishes();
                        setShowBatchModal(true);
                      }}
                    >
                      <FaPlus /> Add Dishes
                    </button>
                  </div>
                  
                  <div className="table-wrapper" style={{ padding: 0 }}>
                    <table className="combogroup-table">
                      <thead>
                        <tr>
                          <th>Dish Name</th>
                          <th>Surcharge</th>
                          <th>Default</th>
                          <th>Sort</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dishMappings.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="empty-text">No dishes mapped to this group. Click the "Add Dishes" button to map dishes.</td>
                          </tr>
                        ) : (
                          dishMappings.map(mapping => (
                            <tr key={mapping.MappingId}>
                              <td className="dish-name-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div>
                                  <div className="name">{mapping.DishName}</div>
                                  <div className="code">{mapping.DishCode}</div>
                                </div>
                                <button 
                                  className="icon-btn delete" 
                                  onClick={() => handleDeleteMapping(mapping.MappingId)} 
                                  title="Remove mapping"
                                  style={{ color: '#e74c3c', padding: '4px' }}
                                >
                                  <FaTrash style={{ fontSize: '11px' }} />
                                </button>
                              </td>
                              <td>${mapping.Surcharge ? mapping.Surcharge.toFixed(2) : "0.00"}</td>
                              <td>
                                {mapping.IsDefault ? (
                                  <span className="badge badge-success"><FaCheck /></span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>{mapping.SortOrder || 0}</td>
                              <td>
                                <div className="action-buttons">
                                  <button className="icon-btn edit" onClick={() => openMappingModal(mapping)} title="Edit mapping">
                                    <FaEdit />
                                  </button>
                                  <button className="icon-btn delete" onClick={() => handleDeleteMapping(mapping.MappingId)} title="Remove mapping">
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="empty-state-view">
              <FaUtensils className="empty-icon" />
              <h3>No Group Selected</h3>
              <p>Please select a parent combo and choose a combo group from the left panel, or create a new group.</p>
              {selectedParentId && (
                <button className="btn-save" onClick={() => openGroupModal()}>
                  <FaPlus /> Create First Group
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* SELECT/ADD NEW PARENT COMBO MODAL */}
      {showParentModal && (
        <div className="modal-overlay" onClick={() => setShowParentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Parent Combo Dish</h2>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Select Dish *</label>
                <div className="combogroupmaster-search-dropdown" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search Dish..."
                    value={parentSearchSelect}
                    onChange={(e) => {
                      setParentSearchSelect(e.target.value);
                      setShowParentSelectDropdown(true);
                      if (!e.target.value) {
                        setSelectedNewParentDishId("");
                      }
                    }}
                    onFocus={() => setShowParentSelectDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowParentSelectDropdown(false), 200);
                    }}
                    className="search-input"
                  />
                  {showParentSelectDropdown && (
                    <div className="combogroupmaster-dropdown-list" style={{ position: 'absolute', width: '100%', zIndex: 1000, background: 'white', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                      {getFilteredDishesForParentAdd().length === 0 ? (
                        <div className="combogroupmaster-dropdown-item no-results" style={{ padding: '8px' }}>
                          No dishes found
                        </div>
                      ) : (
                        getFilteredDishesForParentAdd().map(dish => (
                          <div
                            key={dish.DishId}
                            className={`combogroupmaster-dropdown-item ${selectedNewParentDishId === dish.DishId ? 'selected' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedNewParentDishId(dish.DishId);
                              setParentSearchSelect(`${dish.DishCode} - ${dish.Name}`);
                              setShowParentSelectDropdown(false);
                            }}
                            style={{ padding: '8px', cursor: 'pointer' }}
                          >
                            {dish.DishCode} - {dish.Name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowParentModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveParentCombo}>Add Parent Combo</button>
            </div>
          </div>
        </div>
      )}

      {/* COMBO GROUP MODAL (New / Edit) */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{groupForm.ComboGroupId ? "Edit Combo Group" : "Create Combo Group"}</h2>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Parent Combo Dish</label>
                <select 
                  value={groupForm.ParentComboDishId}
                  onChange={(e) => setGroupForm({ ...groupForm, ParentComboDishId: e.target.value })}
                  disabled={!!groupForm.ComboGroupId}
                >
                  <option value="">Select Parent Combo</option>
                  {parentDishes.map(p => (
                    <option key={p.DishId} value={p.DishId}>{p.Name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Group Name *</label>
                <input 
                  type="text" 
                  value={groupForm.GroupName}
                  onChange={(e) => setGroupForm({ ...groupForm, GroupName: e.target.value })}
                  placeholder="e.g. Choose a Beverage"
                />
              </div>

              <div className="form-row">
                <div className="form-field half">
                  <label>Min Selection</label>
                  <input 
                    type="number" 
                    min="0"
                    value={groupForm.MinSelection}
                    onChange={(e) => setGroupForm({ ...groupForm, MinSelection: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-field half">
                  <label>Max Selection</label>
                  <input 
                    type="number" 
                    min="0"
                    value={groupForm.MaxSelection}
                    onChange={(e) => setGroupForm({ ...groupForm, MaxSelection: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field half">
                  <label>Display Order</label>
                  <input 
                    type="number" 
                    min="0"
                    value={groupForm.DisplayOrder}
                    onChange={(e) => setGroupForm({ ...groupForm, DisplayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-field half checkbox-field">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={groupForm.IsMultiSelect}
                      onChange={(e) => setGroupForm({ ...groupForm, IsMultiSelect: e.target.checked })}
                    />
                    Is Multi Select
                  </label>
                </div>
              </div>

              <div className="form-field checkbox-field">
                <label>
                  <input 
                    type="checkbox" 
                    checked={groupForm.IsActive}
                    onChange={(e) => setGroupForm({ ...groupForm, IsActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              {groupForm.ComboGroupId && (
                <button 
                  className="btn-delete" 
                  onClick={() => handleDeleteGroup(groupForm.ComboGroupId)}
                >
                  Delete Group
                </button>
              )}
              <button className="btn-cancel" onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveGroup}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* DISH MAPPING MODAL (Edit only) */}
      {showMappingModal && (
        <div className="modal-overlay" onClick={() => setShowMappingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Dish Mapping</h2>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Dish</label>
                <input 
                  type="text" 
                  value={availableDishes.find(d => d.DishId === mappingForm.DishId)?.Name || ""} 
                  disabled 
                />
              </div>

              <div className="form-row">
                <div className="form-field half">
                  <label>Surcharge ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={mappingForm.Surcharge}
                    onChange={(e) => setMappingForm({ ...mappingForm, Surcharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-field half">
                  <label>Sort Order</label>
                  <input 
                    type="number" 
                    min="0"
                    value={mappingForm.SortOrder}
                    onChange={(e) => setMappingForm({ ...mappingForm, SortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field half checkbox-field">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={mappingForm.IsDefault}
                      onChange={(e) => setMappingForm({ ...mappingForm, IsDefault: e.target.checked })}
                    />
                    Is Default
                  </label>
                </div>
                <div className="form-field half checkbox-field">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={mappingForm.IsActive}
                      onChange={(e) => setMappingForm({ ...mappingForm, IsActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowMappingModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveMapping}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH ADD MODAL */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal-content" style={{ width: '700px', maxWidth: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Dishes to Group: {selectedGroup?.GroupName}</h2>
            </div>
            
            <div className="modal-body">
              {/* Batch Controls */}
              <div className="batch-controls" style={{ padding: 0, borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="search-bar-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search available dishes..." 
                    value={availableSearch}
                    onChange={(e) => setAvailableSearch(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="btn-save" 
                    type="button"
                    style={{
                      background: 'var(--primary-orange)',
                      color: 'white',
                      border: 'none',
                      padding: '0 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Search
                  </button>
                </div>

                <div className="select-all-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', color: 'var(--text-muted)' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredAvailableDishes.length > 0 && filteredAvailableDishes.every(d => selectedAvailableDishIds.includes(d.DishId))}
                      onChange={() => {
                        const filteredIds = filteredAvailableDishes.map(d => d.DishId);
                        const allSelected = filteredIds.every(id => selectedAvailableDishIds.includes(id));
                        if (allSelected) {
                          setSelectedAvailableDishIds(prev => prev.filter(id => !filteredIds.includes(id)));
                        } else {
                          setSelectedAvailableDishIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                        }
                      }}
                      style={{ accentColor: 'var(--primary-orange)', width: '16px', height: '16px' }}
                    />
                    Select All ({filteredAvailableDishes.length} available)
                  </label>
                  {selectedAvailableDishIds.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setSelectedAvailableDishIds([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e74c3c',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="batch-settings" style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-field">
                    <label>Surcharge ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={batchSurcharge}
                      onChange={(e) => setBatchSurcharge(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Sort Order</label>
                    <input 
                      type="number" 
                      min="0"
                      value={batchSortOrder}
                      onChange={(e) => setBatchSortOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable grid of dishes */}
              <div 
                className="dishes-checkbox-grid" 
                style={{ 
                  maxHeight: '350px', 
                  overflowY: 'auto', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px', 
                  border: '1px solid var(--border-light)',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#fcfcfc'
                }}
              >
                {filteredAvailableDishes.length === 0 ? (
                  <div className="empty-text" style={{ gridColumn: 'span 2' }}>No available dishes found.</div>
                ) : (
                  filteredAvailableDishes.map(dish => {
                    const isChecked = selectedAvailableDishIds.includes(dish.DishId);
                    return (
                      <div 
                        key={dish.DishId} 
                        className={`dish-checkbox-item ${isChecked ? "checked" : ""}`}
                        onClick={() => toggleSelectAvailableDish(dish.DishId)}
                        style={{ padding: '6px 12px' }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}} 
                        />
                        <div className="dish-info">
                          <span className="dish-name" style={{ fontSize: '12px' }}>{dish.Name}</span>
                          <span className="dish-code" style={{ fontSize: '9px' }}>{dish.DishCode}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '16px' }}>
              <span className="selection-count" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--primary-orange)' }}>
                {selectedAvailableDishIds.length} dishes selected
              </span>
              <button className="btn-cancel" onClick={() => setShowBatchModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                disabled={selectedAvailableDishIds.length === 0}
                onClick={handleBatchAdd}
              >
                <FaPlus /> Add Selected Dishes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BATCH ADD MODAL END */}
      {showAssignParentModal && (
        <div className="modal-overlay" onClick={() => setShowAssignParentModal(false)}>
          <div className="modal-content" style={{ width: '500px', maxWidth: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Parent Dishes</h2>
            </div>
            
            <div className="modal-body">
              <div className="form-field" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Combo Group:</label>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary-orange)' }}>
                  {selectedGroup?.GroupName}
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: '16px' }}>
                <label>Search Parent Dish</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search parent dishes..." 
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                />
              </div>

              <div 
                className="dishes-checkbox-grid" 
                style={{ 
                  maxHeight: '250px', 
                  overflowY: 'auto', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px', 
                  border: '1px solid var(--border-light)',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#fcfcfc'
                }}
              >
                {parentDishes
                  .filter(p => p.Name?.toLowerCase().includes(parentSearchQuery.toLowerCase()) || p.DishCode?.toLowerCase().includes(parentSearchQuery.toLowerCase()))
                  .map(parent => {
                    const isChecked = assignedParentIds.includes(parent.DishId);
                    return (
                      <div 
                        key={parent.DishId} 
                        className={`dish-checkbox-item ${isChecked ? "checked" : ""}`}
                        onClick={() => toggleParentAssignment(parent.DishId)}
                        style={{ 
                          padding: '8px 12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid var(--primary-orange)' : '1px solid transparent',
                          background: isChecked ? 'rgba(255, 127, 39, 0.04)' : 'transparent'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}} 
                        />
                        <div className="dish-info" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="dish-name" style={{ fontSize: '13px', fontWeight: '600' }}>{parent.Name}</span>
                          <span className="dish-code" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{parent.DishCode}</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '16px' }}>
              <button className="btn-cancel" onClick={() => setShowAssignParentModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSaveAssignedParents}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComboGroupMaster;
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/core/routing/History",
  'sap/m/MessageBox',
  "sap/ui/model/json/JSONModel",
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, MessageToast, History, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("sapips.training.employeeapp.controller.EditInfoChg", {
      onInit: function () {
        // Get the router object
        this.getOwnerComponent().getRouter().getRoute("RouteEditInfoPage").attachPatternMatched(this._onObjectMatched, this);

        this._aDeletedSkills = [];  // <-- array to keep deleted skills temporarily

      },

      _onObjectMatched: function (oEvent) {
        this._aDeletedSkills = [];  // reset on each load

        var sData = oEvent.getParameter("arguments").data;
        var oDecodedData = JSON.parse(decodeURIComponent(sData));

        // Handle date conversion
        if (oDecodedData.employee.DateHire) {
          oDecodedData.employee.DateHire = new Date(oDecodedData.employee.DateHire);
        }

        // Set employee model
        var oEmpModel = new JSONModel(oDecodedData.employee);
        this.getView().setModel(oEmpModel, "EmpEditModel");

        // Set skills model
        var oSkillsModel = new JSONModel({ skills: oDecodedData.skills || [] });
        this.getView().setModel(oSkillsModel, "SkillsEditModel");
      },

      // Go back to previous Page
      onPressBack: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();
        var oRouter = this.getOwnerComponent().getRouter();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          oRouter.navTo("RouteEditPage", {}, true);
        }
      },

      // Restricts user using only Letters
      onLetterInputLiveChange: function (oEvent) {
        var oInput = oEvent.getSource();
        var sValue = oInput.getValue();

        // Remove all non-alphabetical characters
        var sFiltered = sValue.replace(/[^a-zA-Z]/g, "");

        if (sValue !== sFiltered) {
          oInput.setValue(sFiltered);
        }
      },

      // Restricts user using only Numbers from 0 to 90
      onNumberInputLiveChange: function (oEvent) {
        var oInput = oEvent.getSource();
        var sValue = oInput.getValue();

        // Remove non-digit characters
        var sFiltered = sValue.replace(/[^0-9]/g, "");

        if (sValue !== sFiltered) {
          oInput.setValue(sFiltered);
          return; // Wait for next input
        }

        var iNumber = parseInt(sFiltered, 10);

        // If number is out of range or NaN, reset or limit
        if (isNaN(iNumber)) {
          oInput.setValue("");
        } else if (iNumber > 90) {
          oInput.setValue("90");
        }
      },

      /*onPressSave: function () {
        var oView = this.getView();
        var oModel = this.getOwnerComponent().getModel("Northwind");
        var oUpdatedData = oView.getModel("EmpEditModel").getData();
        var sEmpID = oUpdatedData.EmployeeID;
        var sEmpPath = `/Employees('${sEmpID}')`;

        oUpdatedData.CareerLevel = String(oUpdatedData.CareerLevel);

        var that = this;

        // 1. Save Employee
        oModel.update(sEmpPath, oUpdatedData, {
          success: function () {
            MessageToast.show("Employee data saved successfully.");

            // 2. Delete all skills from backend for this employee
            oModel.read(`/Skills?$filter=EmployeeID eq '${sEmpID}'`, {
              success: function (oData) {
                var aExistingSkills = oData.results || [];
                var iDeleted = 0;

                if (aExistingSkills.length === 0) {
                  // Nothing to delete; just create skills
                  that._createAllSkills();
                  return;
                }

                aExistingSkills.forEach(function (skill) {
                  var sSkillPath = `/Skills(EmployeeID='${sEmpID}',SkillName='${encodeURIComponent(skill.SkillName)}')`;
                  oModel.remove(sSkillPath, {
                    success: function () {
                      iDeleted++;
                      if (iDeleted === aExistingSkills.length) {
                        // After all skills deleted
                        that._createAllSkills();
                      }
                    },
                    error: function (oError) {
                      console.error("Error deleting skill:", skill.SkillName, oError);
                      MessageBox.error("Failed to delete existing skill: " + skill.SkillName);
                    }
                  });
                });
              },
              error: function (oError) {
                console.error("Error reading skills", oError);
                MessageBox.error("Failed to read existing skills.");
              }
            });
          },
          error: function (oError) {
            MessageBox.error("Error saving employee data.");
            console.error(oError);
          }
        });
      },*/

      onPressSave: function () {
        var oView = this.getView();
        var oModel = this.getOwnerComponent().getModel("Northwind");
        var oUpdatedData = oView.getModel("EmpEditModel").getData();
        var sEmpID = oUpdatedData.EmployeeID;
        var sEmpPath = `/Employees('${sEmpID}')`;

        var aSkills = oView.getModel("SkillsEditModel").getProperty("/skills") || [];

        // 🔎 Validate employee fields
        if (!oUpdatedData.FirstName?.trim() ||
          !oUpdatedData.LastName?.trim() ||
          !oUpdatedData.Age ||
          !oUpdatedData.CareerLevel ||
          !oUpdatedData.CurrentProject ||
          !oUpdatedData.DateHire) {
          MessageToast.show("Please fill in all employee details before saving.");
          return;
        }

        // 🔎 Validate at least one skill
        if (aSkills.length === 0) {
          MessageToast.show("Employee must have at least one skill.");
          return;
        }

        oUpdatedData.CareerLevel = String(oUpdatedData.CareerLevel);

        var that = this;

        // ✅ Save employee to backend
        oModel.update(sEmpPath, oUpdatedData, {
          success: function () {
            MessageToast.show("Employee data saved successfully.");

            // 🧹 Delete all current skills before re-saving (if applicable)
            oModel.read(`/Skills?$filter=EmployeeID eq '${sEmpID}'`, {
              success: function (oData) {
                var aExistingSkills = oData.results || [];
                var iDeleted = 0;

                if (aExistingSkills.length === 0) {
                  that._createAllSkills();
                  return;
                }

                aExistingSkills.forEach(function (skill) {
                  var sSkillPath = `/Skills(EmployeeID='${sEmpID}',SkillName='${encodeURIComponent(skill.SkillName)}')`;
                  oModel.remove(sSkillPath, {
                    success: function () {
                      iDeleted++;
                      if (iDeleted === aExistingSkills.length) {
                        that._createAllSkills();
                      }
                    },
                    error: function (oError) {
                      console.error("Error deleting skill:", skill.SkillName, oError);
                      MessageBox.error("Failed to delete existing skill: " + skill.SkillName);
                    }
                  });
                });
              },
              error: function (oError) {
                console.error("Error reading skills", oError);
                MessageBox.error("Failed to read existing skills.");
              }
            });
          },
          error: function (oError) {
            MessageBox.error("Error saving employee data.");
            console.error(oError);
          }
        });
      },


      // Create all current skills from the SkillsEditModel
      _createAllSkills: function () {
        var oView = this.getView();
        var oModel = this.getOwnerComponent().getModel("Northwind");
        var sEmpID = oView.getModel("EmpEditModel").getProperty("/EmployeeID");
        var aSkills = oView.getModel("SkillsEditModel").getProperty("/skills") || [];

        aSkills.forEach(function (oSkill) {
          var oSkillData = {
            EmployeeID: sEmpID,
            SkillName: oSkill.SkillName,
            ProficiencyLevel: oSkill.ProficiencyLevel
          };

          oModel.create("/Skills", oSkillData, {
            success: function () {
              console.log("Skill created:", oSkill.SkillName);
            },
            error: function (oError) {
              console.error("Error creating skill:", oSkill.SkillName, oError);
              MessageBox.error("Failed to save skill: " + oSkill.SkillName);
            }
          });
        });

        // Clear temporary deletions
        this._aDeletedSkills = [];
      },

      onPressAddSkill: function () {
        var oView = this.getView();

        // Initialize or clear the model for new skill entry
        var oNewSkillModel = new JSONModel({
          SkillName: "",
          ProficiencyLevel: ""
        });
        oView.setModel(oNewSkillModel, "NewSkillModel");

        oView.byId("addSkillDialog1").open();
      },

      onDialogSave: function () {
        var oView = this.getView();
        var oNewSkill = oView.getModel("NewSkillModel").getData();
        var oSkillsModel = oView.getModel("SkillsEditModel");
        var aSkills = oSkillsModel.getProperty("/skills") || [];

        if (!oNewSkill.SkillName || !oNewSkill.ProficiencyLevel) {
          MessageBox.warning("Please select both skill and proficiency.");
          return;
        }

        // Add new skill with correct property names
        aSkills.push({
          SkillName: oNewSkill.SkillName,
          ProficiencyLevel: oNewSkill.ProficiencyLevel
        });

        oSkillsModel.setProperty("/skills", aSkills);
        oSkillsModel.refresh();

        var oDialog = oView.byId("addSkillDialog1");
        if (oDialog) {
          oDialog.close();

          // Reset NewSkillModel here, so next time the dialog opens, inputs are empty
          oView.setModel(new JSONModel({ SkillName: "", ProficiencyLevel: "" }), "NewSkillModel");
        } else {
          console.error("Dialog 'addSkillDialog1' not found");
        }
      },

      onDialogCancel: function () {
        var oView = this.getView();
        oView.byId("addSkillDialog1").close();
        oView.setModel(new JSONModel({ SkillName: "", ProficiencyLevel: "" }), "NewSkillModel");
      },

      onPressDelSkill: function () {
        var oView = this.getView();
        var oTable = oView.byId("skillsTable1");
        var oSkillsModel = oView.getModel("SkillsEditModel");
        var aSkills = oSkillsModel.getProperty("/skills");

        var aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length === 0) {
          MessageBox.warning("Please select at least one skill to delete.");
          return;
        }

        MessageBox.confirm("Are you sure you want to delete the selected skill(s)?", {
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("SkillsEditModel");
                var oSkill = oContext.getObject();

                // Track deleted skill in controller property
                this._aDeletedSkills.push(oSkill);

                // Remove from local model (UI only)
                var iIndex = aSkills.findIndex(function (skill) {
                  return skill.SkillName === oSkill.SkillName;
                });
                if (iIndex !== -1) {
                  aSkills.splice(iIndex, 1);
                }
              }.bind(this));

              oSkillsModel.setProperty("/skills", aSkills);
              oTable.removeSelections();
            }
          }.bind(this)
        });
      },

      onPressCanc: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();
        var oRouter = this.getOwnerComponent().getRouter();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          oRouter.navTo("RouteEditPage", {}, true);
        }
      }

    });
  });
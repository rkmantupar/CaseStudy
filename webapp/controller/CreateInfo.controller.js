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
  function (Controller, MessageToast, History, MessageBox,) {
    "use strict";

    return Controller.extend("sapips.training.employeeapp.controller.CreateInfo", {
      onInit: function () {
        var oModel = new sap.ui.model.json.JSONModel({
          FirstName: "",
          LastName: "",
          Age: "",
          CareerLevel: "",
          CurrentProject: "",
          DateHire: null,
          skills: []
        });
        this.getView().setModel(oModel);

        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.getRoute("RouteCreatePage").attachPatternMatched(this._onObjectMatched, this);
      },

      // Go back to Main Page
      onPressBack: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();
        var oRouter = this.getOwnerComponent().getRouter();
        var oView = this.getView();

        // Find all inputs, textareas, datepickers, comboboxes
        var aControls = oView.findAggregatedObjects(true, function (oControl) {
          return oControl.isA("sap.m.Input") ||
            oControl.isA("sap.m.TextArea") ||
            oControl.isA("sap.m.DatePicker") ||
            oControl.isA("sap.m.ComboBox");
        });

        // Check if any control has a value set
        var bHasValue = aControls.some(function (oControl) {
          if (oControl.isA("sap.m.ComboBox")) {
            // For ComboBox, check selectedKey or selectedItem
            return oControl.getSelectedKey() !== "";
          } else if (oControl.isA("sap.m.DatePicker")) {
            // For DatePicker, check date value
            return oControl.getDateValue() !== null;
          } else {
            // For Input/TextArea, check text value
            return oControl.getValue().trim() !== "";
          }
        });

        if (bHasValue) {
          sap.m.MessageBox.confirm("Some fields have values. Are you sure you want to clear?", {
            onClose: function (sAction) {
              if (sAction === "OK") {
                aControls.forEach(function (oControl) {
                  if (oControl.isA("sap.m.ComboBox")) {
                    oControl.setSelectedKey("");
                  } else if (oControl.isA("sap.m.DatePicker")) {
                    oControl.setDateValue(null);
                  } else {
                    oControl.setValue("");
                  }
                  oControl.setValueState("None");
                });

                var oModel = oView.getModel();
                oModel.setProperty("/skills", []);

                if (sPreviousHash !== undefined) {
                  window.history.go(-1);
                } else {
                  oRouter.navTo("RouteMainView", {}, true);
                }
              }
            }
          });
        } else {
          // No values, clear immediately
          aControls.forEach(function (oControl) {
            if (oControl.isA("sap.m.ComboBox")) {
              oControl.setSelectedKey("");
            } else if (oControl.isA("sap.m.DatePicker")) {
              oControl.setDateValue(null);
            } else {
              oControl.setValue("");
            }
            oControl.setValueState("None");

            if (sPreviousHash !== undefined) {
              window.history.go(-1);
            } else {
              oRouter.navTo("RouteMainView", {}, true);
            }
          });
        }
      },

      // Date of Hire
      onDateChange: function (oEvent) {
        var sNewDate = oEvent.getParameter("value"); // e.g. "2025-05-31"
        sap.m.MessageToast.show("Selected: " + sNewDate);
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

      /*--------------------------------------------------------
          *Skills/Proficiency
      ----------------------------------------------------------*/
      onPressAddSkill: function () {
        // Reset dialog fields
        this.byId("skillInput").setSelectedKey("");
        this.byId("proficiencyInput").setSelectedKey("");
        this.byId("addSkillDialog").open();
      },

      onDialogCancel: function () {
        this.byId("addSkillDialog").close();
      },

      onDialogSave: function () {
        var oSkillCombo = this.byId("skillInput");
        var oProficiencyCombo = this.byId("proficiencyInput");

        var sSkillId = oSkillCombo.getSelectedKey();
        var sSkillName = oSkillCombo.getSelectedItem()?.getText();

        var sProficiencyId = oProficiencyCombo.getSelectedKey();
        var sProficiencyLevel = oProficiencyCombo.getSelectedItem()?.getText();

        if (!sSkillId || !sProficiencyId) {
          MessageToast.show("Please select both skill and proficiency.");
          return;
        }

        var oModel = this.getView().getModel();
        var aSkills = oModel.getProperty("/skills") || [];

        // Check for duplicates by skillId
        var bExists = aSkills.some(function (item) {
          return item.skill === sSkillId;
        });

        if (bExists) {
          MessageToast.show("Skill already exists.");
          return;
        }

        // Add new skill
        aSkills.push({
          skillId: sSkillId,
          skillName: sSkillName,
          proficiencyId: sProficiencyId,
          proficiencyLevel: sProficiencyLevel
        });

        oModel.setProperty("/skills", aSkills);

        // Reset fields and close dialog
        oSkillCombo.setSelectedKey("");
        oProficiencyCombo.setSelectedKey("");
        this.byId("addSkillDialog").close();
        MessageToast.show("Skill added.");
      },

      onPressDelSkill: function () {
        var oTable = this.byId("skillsTable");
        var aSelectedItems = oTable.getSelectedItems();
        var oModel = this.getView().getModel();
        var aSkills = oModel.getProperty("/skills");

        if (aSelectedItems.length === 0) {
          MessageToast.show("Please select a skill to delete.");
          return;
        }

        aSelectedItems.forEach(function (oItem) {
          var sSkill = oItem.getBindingContext().getObject().skill;

          // Remove from data model
          aSkills = aSkills.filter(function (item) {
            return item.skill !== sSkill;
          });
        });

        oModel.setProperty("/skills", aSkills);
        oTable.removeSelections();

        MessageToast.show("Selected skill(s) deleted.");
      },

      onPressSave: function () {
        var oView = this.getView();
        var oNorthwindModel = this.getOwnerComponent().getModel("Northwind");

        // Collect values from inputs
        var sFirstName = oView.byId("idInputFirstName").getValue().trim();
        var sLastName = oView.byId("idInputLastName").getValue().trim();
        var sAge = parseInt(oView.byId("idInputAge").getValue().trim(), 10);
        var sCareerLevel = oView.byId("idComboBoxCareerLevel").getSelectedKey();
        var sCurrentProject = oView.byId("idComboBoxCurrentProject").getSelectedKey();
        var sDate = oView.byId("idDatePickerDateOfHire").getDateValue();

        if (!sFirstName || !sLastName || isNaN(sAge) || !sCareerLevel || !sCurrentProject || !sDate) {
          MessageBox.error("Please fill all required fields correctly.");
          return;
        }

        //Generate automatically Employee ID
        var oToday = new Date();
        var sDay = String(oToday.getDate()).padStart(2, '0');
        var sMonth = String(oToday.getMonth() + 1).padStart(2, '0');
        var sEmployeeId = "EmployeeID" + sLastName + sFirstName + sDay + sMonth;

        var oNewEmployee = {
          EmployeeID: sEmployeeId,
          FirstName: sFirstName,
          LastName: sLastName,
          Age: sAge,
          CareerLevel: sCareerLevel,
          CurrentProject: sCurrentProject,
          DateHire: sDate,
        };

        // Call create method on OData model
        var that = this;
        oNorthwindModel.create("/Employees", oNewEmployee, {
          success: function (oCreatedEmployee) {
            MessageToast.show("Employee created successfully.");

            var sEmployeeId = oCreatedEmployee.EmployeeID; // adapt key name!

            // Get skills from JSONModel or from wherever your skills data source is
            var aSkills = that.getView().getModel().getProperty("/skills") || [];

            // Loop over each skill and create on backend linked to new employee
            aSkills.forEach(function (skill) {
              var oSkillData = {
                EmployeeID: sEmployeeId,
                SkillId: skill.skillId,
                SkillName: skill.skillName,
                ProficiencyID: skill.proficiencyId,
                ProficiencyLevel: skill.proficiencyLevel
              };

              console.log("Posting skill data:", oSkillData);

              oNorthwindModel.create("/Skills", oSkillData, {
                success: function () {
                  iSuccessCount++;
                  if (iSuccessCount === iTotalSkills) {
                    // Only navigate once all skills are added
                    var oRouter = that.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteEmployeeList");
                  }
                },
                error: function () {
                  MessageBox.error("Error saving skill: " + skill.skill);
                  console.error("Error saving skill:", skill.skill, oError);
                }
              });
            });

            //var oRouter = this.getOwnerComponent().getRouter();
            //oRouter.navTo("RouteEmployeeList");
          }.bind(this),
          error: function (oError) {
            MessageBox.error("Error creating employee.");
            console.error(oError);
          }
        });

      }

    });
  });
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  'sap/m/MessageBox'
], (Controller, Filter, FilterOperator, MessageToast, MessageBox) => {
  "use strict";

  return Controller.extend("sapips.training.employeeapp.controller.EmployeeList", {
    onInit() {
      this._Page = this.byId("idEmployeeList");
    },

    //Filter Search Bar
    onFilterProduct: function (oEvent) {
      const aFilter = [];
      const sQuery = oEvent.getParameter("query");

      if (sQuery) {
        aFilter.push(new Filter({
          filters: [
            new Filter("FirstName", FilterOperator.Contains, sQuery),
            new Filter("LastName", FilterOperator.Contains, sQuery),
            //*************new Filter("Age", FilterOperator.Contains, sQuery),
            //*************new Filter("HireDate", FilterOperator.Contains, sQuery),
            new Filter("CareerLevel", FilterOperator.Contains, sQuery),
            new Filter("CurrentProject", FilterOperator.Contains, sQuery)
          ],
          and: false  // false = OR, true = AND
        }));
      }

      //Filter Binding
      const oList = this.byId("idTableEmployees");
      const oBinding = oList.getBinding("items");
      oBinding.filter(aFilter);
    },

    //Delete Button Main Page
    onPressDelete: function () {
      var oTable = this.byId("idTableEmployees");
      var aSelectedItems = oTable.getSelectedItems();
      var oModel = this.getView().getModel("Northwind");

      if (aSelectedItems.length === 0) {
        MessageToast.show("No employees selected");
        return;
      }

      MessageBox.confirm("Are you sure you want to delete selected employees?", {
        onClose: function (sAction) {
          if (sAction === "OK") {
            aSelectedItems.forEach(function (oItem) {
              var oContext = oItem.getBindingContext("Northwind");
              var sPath = oContext.getPath();
              var oData = oContext.getObject();
              var sEmployeeId = oData.EmployeeID;

              // 1. First delete related Skills
              var sSkillFilterPath = "/Skills?$filter=EmployeeID eq '" + sEmployeeId + "'";
              oModel.read(sSkillFilterPath, {
                success: function (oSkillData) {
                  var aSkills = oSkillData.results || [];
                  aSkills.forEach(function (skill) {
                    var sSkillPath = "/Skills(EmployeeID='" + skill.EmployeeID + "',SkillId='" + skill.SkillId + "')";
                    oModel.remove(sSkillPath, {
                      success: function () {
                        console.log("Deleted skill:", sSkillPath);
                      },
                      error: function () {
                        console.warn("Failed to delete skill:", sSkillPath);
                      }
                    });
                  });

                  // 2. After deleting skills, delete the employee
                  oModel.remove(sPath, {
                    success: function () {
                      MessageToast.show("Employee deleted successfully.");
                      oTable.removeSelections();
                    },
                    error: function () {
                      MessageToast.show("Error deleting employee.");
                    }
                  });

                },
                error: function () {
                  MessageBox.error("Failed to fetch related skills for deletion.");
                }
              });
            });
          }
        }
      });
    },

    //Add Button
    onPressAdd: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteCreatePage", {
      });
    },

    //Navigate Employee Information
    onPressEmpInfo: function (oEvent) {
      // Get the binding context of the row (ColumnListItem) where the button was clicked
      var oSelectedItem = oEvent.getSource().getParent().getParent(); // Button → HBox → ColumnListItem
      var oContext = oSelectedItem.getBindingContext("Northwind");
      var oData = oContext.getObject();

      // Pass the data as a JSON string (encode it)
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("RouteEditPage", {
        data: encodeURIComponent(JSON.stringify(oData))
      });
    }


  });
});
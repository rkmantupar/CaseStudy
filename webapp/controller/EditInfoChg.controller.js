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

      },

      _onObjectMatched: function (oEvent) {
        //var sData = decodeURIComponent(oEvent.getParameter("arguments").data);
        //var oData = JSON.parse(sData);

        var sData = oEvent.getParameter("arguments").data;
        var oDecodedData = JSON.parse(decodeURIComponent(sData));

        if (oDecodedData.DateHire) {
          oDecodedData.DateHire = new Date(oDecodedData.DateHire);
        }

        var oModel = new sap.ui.model.json.JSONModel(oDecodedData);
        this.getView().setModel(oModel, "EmpEditModel");
        
        //if (oData.DateHire) {
        //  oData.DateHire = new Date(oData.DateHire);
        //}

        // Set to a local model to bind to Input fields
        //var oModel = new sap.ui.model.json.JSONModel(oData);
        //this.getView().setModel(oModel, "EmpEditModel");
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

      onPressSave: function () {
        var oView = this.getView();

        // Get the edited data
        var oUpdatedData = oView.getModel("EmpEditModel").getData();

        // OPTIONAL: validate required fields
        if (!oUpdatedData.FirstName || !oUpdatedData.LastName) {
          MessageBox.error("Please fill in all required fields.");
          return;
        }

        // OPTIONAL: Clean or cast data
        oUpdatedData.CareerLevel = String(oUpdatedData.CareerLevel); // Ensure it matches backend type

        // Assuming you have an OData model named "Northwind" set in your Component
        var oModel = this.getOwnerComponent().getModel("Northwind");

        var sPath = `/Employees('${oUpdatedData.EmployeeID}')`; // Your entity key

        oModel.update(sPath, oUpdatedData, {
          success: function () {
            MessageToast.show("Employee data saved successfully.");
          },
          error: function (oError) {
            MessageBox.error("Error saving data. Check console.");
            console.error(oError);
          }
        });
      }

    });
  });
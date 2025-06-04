sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    'sap/m/MessageBox',
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageToast, History, MessageBox, JSONModel) {
        "use strict";

        return Controller.extend("sapips.training.employeeapp.controller.EditInfo", {
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteEditPage").attachPatternMatched(this._onRouteMatched, this);
            },


            _onRouteMatched: function (oEvent) {
                // 1. Get and decode employee data from route
                var sData = oEvent.getParameter("arguments").data;
                var oDecodedData = JSON.parse(decodeURIComponent(sData));
                console.log("Decoded Employee Data:", oDecodedData);

                // 2. Set employee model
                var oEmpModel = new sap.ui.model.json.JSONModel(oDecodedData);
                this.getView().setModel(oEmpModel, "empModel");

                // 3. Load Skills.json
                /* var oSkillsModel = new sap.ui.model.json.JSONModel();
                var sSkillsPath = "/localService/mainService/data/Skills.json";
                console.log("Loading Skills JSON from:", sSkillsPath); 

                oSkillsModel.loadData(sSkillsPath);*/
                var oODataModel = this.getOwnerComponent().getModel("Northwind");
                var sEmployeeID = oDecodedData.EmployeeID;

                // Filter skills by EmployeeID using OData read
                oODataModel.read("/Skills", {
                    filters: [new sap.ui.model.Filter("EmployeeID", "EQ", sEmployeeID)],
                    success: function (oData) {
                        var oSkillsModel = new JSONModel(oData.results);
                        this.getView().setModel(oSkillsModel, "skillsModel");
                        console.log("Loaded skills from backend:", oData.results);
                    }.bind(this),
                    error: function (oError) {
                        console.error("Failed to load skills from backend", oError);
                        MessageBox.error("Unable to load skills.");
                    }
                });

                // 4. Wait for skills to load, then filter by employee
                // Clear old model if it exists
                if (this.getView().getModel("skillsModel")) {
                    this.getView().getModel("skillsModel").setData([]); // clear old data
                }

                oSkillsModel.attachRequestCompleted(function () {
                    var aAllSkills = oSkillsModel.getData(); // expecting array directly, or wrap it

                    // If it's wrapped like { skills: [...] }, use oSkillsModel.getData().skills
                    if (Array.isArray(aAllSkills)) {
                        // OK
                    } else if (aAllSkills && Array.isArray(aAllSkills.skills)) {
                        aAllSkills = aAllSkills.skills;
                    } else {
                        console.error("Unexpected Skills data structure:", oSkillsModel.getData());
                        return;
                    }

                    var sEmployeeID = oDecodedData.EmployeeID;
                    var aFilteredSkills = aAllSkills.filter(function (skill) {
                        return skill.EmployeeID === sEmployeeID;
                    });

                    console.log("Filtered skills for employee", sEmployeeID, ":", aFilteredSkills);

                    // 5. Set filtered skills to new model
                    var oFilteredModel = new sap.ui.model.json.JSONModel(aFilteredSkills);
                    this.getView().setModel(oFilteredModel, "skillsModel");
                }.bind(this)); // Important: bind 'this'
            },

            // Go back to Main Page
            onPressBack: function () {
                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();
                var oRouter = this.getOwnerComponent().getRouter();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    oRouter.navTo("RouteMainView", {}, true);
                }
            },

            onPressEmployeeInfo: function () {
                // Show employee info panel, hide skills panel
                this.byId("employeeInfoPanel").setVisible(true);
                this.byId("skillsPanel").setVisible(false);
            },

            onPressSkills: function () {
                // Show skills panel, hide employee info panel
                this.byId("employeeInfoPanel").setVisible(false);
                this.byId("skillsPanel").setVisible(true);
            },

            //Navigate Employee Information
            onPressEdit: function () {
                //const oData = this.getView().getModel("empModel").getData(); // use the correct model name!
                //this.getOwnerComponent().getRouter().navTo("RouteEditInfoPage", {
                //  data: encodeURIComponent(JSON.stringify(oData))

                ////var oData = this.getView().getModel("empModel").getData();

                //this.getOwnerComponent().getRouter().navTo("RouteEditInfoPage", {
                //    data: encodeURIComponent(JSON.stringify(oData))

                var oEmpData = this.getView().getModel("empModel").getData();
                var aSkillsData = this.getView().getModel("skillsModel")?.getData() || [];

                var oCombinedData = {
                    employee: oEmpData,
                    skills: aSkillsData
                };

                // Navigate and pass data
                this.getOwnerComponent().getRouter().navTo("RouteEditInfoPage", {
                    data: encodeURIComponent(JSON.stringify(oCombinedData))
                });
            }
        });
    });
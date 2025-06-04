sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/odata/v2/ODataModel",
  "sap/ui/core/util/MockServer"
], function (UIComponent, ODataModel, MockServer) {
  "use strict";

  return UIComponent.extend("sapips.training.employeeapp.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      // 1. Setup Mock Server
      const oMockServer = new MockServer({
        rootUri: "/mock/odata/"
      });

      // 2. Simulate Metadata + Mockdata
      oMockServer.simulate("localService/mainService/metadata.xml", {
        sMockdataBaseUrl: "localService/mainService/mockdata", 
        bGenerateMissingMockData: true
      });

      oMockServer.start();

      // 3. Call base class init
      UIComponent.prototype.init.apply(this, arguments);

      // 4. Initialize router
      this.getRouter().initialize();

      // javascript
      jQuery.sap.includeStyleSheet("css/style.css");
    }
  });
});

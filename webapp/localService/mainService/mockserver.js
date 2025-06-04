sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/util/MockServer"
  ], function(UIComponent, MockServer) {
    "use strict";
  
    return UIComponent.extend("your.namespace.Component", {
      init: function() {
        // Start mock server
        var oMockServer = new MockServer({
          rootUri: "/mock/odata/"
        });
  
        oMockServer.simulate("localService/mainService/metadata.xml", {
          sMockdataBaseUrl: "localService/mainService/mockdata"
        });
  
        oMockServer.start();
  
        UIComponent.prototype.init.apply(this, arguments);
      }
    });
  });
/**
 *  (c) Topix AG, St.Gallen
 *  Created by Martin Thomann
 */

var TwixlList = {

    id: undefined,

    init: function(id) {
        TwixlLogger.init();
        merklistDB.init(id);
        TwixlList.initEventListeners();
        TwixlList.initElements();
        TwixlList.initRoutes();
    },

    initRoutes: function() {
        TwixlRouter.run({
            'add': TwixlList.actionAddProduct,
            'addButton': TwixlList.actionAddProductButton,
            'show': TwixlList.actionShowList,
            'confirm': TwixlList.actionPlaceOrder,
            '': TwixlList.actionShowList,
        });
    },

    initElements: function() {
        $('.twixl-list a.twixl-remove').live('click touch', TwixlList.actionRemoveProduct);
        $('.twixl-list a.twixl-place-order').live('click touch', TwixlList.actionPlaceOrder);
        $('.twixl-list a.twixl-reset-list').live('click touch', TwixlList.actionRemoveAllProducts);
        $('.twixl-list a.twixl-show-list').live('click touch', TwixlList.actionShowList);
        $('.twixl-list a.twixl-place-order').live('click touch', TwixlList.actionPlaceOrder);
        $('#twixl-form-confirm-order').submit(TwixlList.actionPlaceOrder);
        $('#twixl-list-product-button a').live('click touch', TwixlList.actionAddProductFromButton);
    },

    initEventListeners: function() {
        TwixlLogger.info('Attaching event listeners');
        if (window.addEventListener) {
            window.addEventListener('offline', TwixlList.eventOffline);
            window.addEventListener('online', TwixlList.eventOnline);
        } else {
            document.body.attachEvent('onoffline', TwixlList.eventOffline);
            document.body.attachEvent('ononline', TwixlList.eventOnline);
        }
        if (TwixlURL.getParameter('do') == 'addButton') {
            window.setInterval(TwixlList.eventStorage, 1000);
        }
    },

    eventOffline: function() {
        TwixlLogger.info('Device went offline');
        $('#twixl-list .twixl-actions-online').hide();
        $('#twixl-list .twixl-actions-offline').show();
    },

    eventOnline: function() {
        TwixlLogger.info('Device went online');
        $('#twixl-list .twixl-actions-online').show();
        $('#twixl-list .twixl-actions-offline').hide();
    },

    eventStorage: function() {
        TwixlList.actionAddProductButton();
    },

    actionAddProduct: function() {
        var product = TwixlURL.getParameter('id');
        merklistDB.add(product);
        TwixlList.actionShowList();
        return false;
    },

    actionAddProductFromButton: function() {
        var product = TwixlURL.getParameter('id');
        merklistDB.add(product);
        TwixlList.actionAddProductButton();
        return false;
    },

    actionAddProductButton: function() {
        $('body').css('margin', '4px');
        var product = TwixlURL.getParameter('id');
        var productData = merklistDB.get(product);
        var html = 'Add one';
        if (productData) {
            html = productData['count'] + ' x ' + productData['product'];
        }
        $('#twixl-list-product-button a').html(html);
        TwixlList.showScreen('#twixl-list-product-button');
        return false;
    },

    actionRemoveProduct: function() {
        var tablerow = $(this).parents('tr');
        var tablerowContent = tablerow.children('td');
        var product = tablerowContent[0].innerHTML;
        merklistDB.remove(product);
        TwixlList.actionShowList();
        return false;
    },
    
    
    actionRemoveAllProducts: function() {
        merklistDB.removeAll();
    },

    actionShowList: function() {

        var products = merklistDB._getAll();
        TwixlLogger.dump(products);
        
        if (navigator.onLine) {
            TwixlList.eventOnline();
        } else {
            TwixlList.eventOffline();
        }

        $('#twixl-list table tbody').html('');
        $('#twixl-list table tfoot').html('');

        var total = 0;
        for (var i = 0; i < products.length; i++) {
            var row = products[i];
            var template = $('<tr/>', {'product_id': row['id']});
            var remove   = $('<a/>', {'class': 'twixl-remove', 'text': 'löschen', 'href': ''});
            var actions  = $('<td/>', {'class': 'actions'});
            template.append($('<td/>', {'class': 'product', 'text': row}));

            actions.append(remove);
            template.append(actions);
            $('#twixl-list table tbody').append(template);

        }

        if (products.length == 0) {
            TwixlList.showScreen('#twixl-empty-list');
        } else {
            TwixlList.showScreen('#twixl-list');
        }


        return false;

    },

    actionPlaceOrder: function() {
        
        if(merklistDB.getAll().length == 0) {
            alert("Es muss mindestens 1 Produkt auf der Merkliste sein.");
            return;
        }
        
        //TwixlList.showScreen('#twixl-place-order-progress');
        TwixlLogger.info('Placing order...');

        $url_string = "";
        
        $url_string = "Sehr geehrter <Kundenname>,\r\n\r\n";
        $url_string += "Vielen Dank für Ihre Zeit heute. Wie besprochen finden Sie untenstehend die Links zum herunterladen der gewünschten Informationen:\r\n";
                                
        
        var mailproducts = merklistDB.getAll();
        TwixlLogger.dump(mailproducts);
        
        var mailtotal = 0;
        for(var i=0; i < mailproducts.length; i++) {
            var entry = mailproducts[i];
            $url_string += entry + ": ";
            $url_string += "https://www.topix.ch/downloads/" + entry + ".pdf" + "\r\n";
        }
       
        $url_string += "\r\nFür weitere Fragen stehe ich gerne zur Verfügung.\r\n";
        $url_string += "\r\nFreundliche Grüsse";

        $url_string = encodeURIComponent($url_string);
        
        sendMail($url_string);
        
        TwixlList.showScreen('#twixl-order-finish');

        return false;

    },

    showScreen: function(name) {
        $('.twixl-list').hide();
        $(name).show();
    },

};


function sendMail(text) {
    var bodytext = text + "";
    var date=new Date();  
    var dd=date.getDate();  
    var mm=date.getMonth() + 1;  
    var yy=date.getFullYear();  
    var HH=date.getHours();  
    var MM=date.getMinutes();  
    var subject = dd+"."+mm+"."+yy; 
  
    var link = "mailto:?subject=" + escape("Merkliste, " + subject) + "&body=" + bodytext;
    window.location.href = link;            
} 


var merklistDB = {

    id: undefined,
    products: {},

    init: function(id){
        this.id = id;
        TwixlLogger.info('DB with ID: ' + id);
        var data = merklistDB._getAll();
        this.products = data;
        merklistDB._set(data);
    },
    
    
    add: function(product) {
        
        if(!merklistDB._checkIfExists(product)){
            var data = merklistDB.getAll();

            data.push(product);
            merklistDB._set(data);
            this.products = data;
        }
    },
    
    
    getAll: function() {
        var data = merklistDB._getAll();
        var result = [];
        for (var product in data) {
            var productData = merklistDB._checkProduct(product);
            if (productData) {
                productData['id']    = product;
                result.push(productData);
            }
        }
        return result;
    },
    
    _getAll: function() {
        try {
            var data = localStorage.getItem(merklistDB.id);
            return (data == undefined) ? {} : JSON.parse(data);
        } catch (e) {
            return {};
        }
    },

    
    _set: function(data) {
        localStorage.setItem(merklistDB.id, JSON.stringify(data));
    },
    
    
    _checkProduct: function(product) {
        var productData = merklistDB.products[product];
        if (!productData) {
            TwixlLogger.error('Unknown product: ' + product);
            return false;
        }
        return productData;
    },
    
    _checkIfExists(product) {
        var productData = merklistDB._getAll();
        for(var i=0; i < productData.length; i++) {
            var entry = productData[i];
            if(entry === product){
                return true;
            }
            
            
        }
    },
    
    removeAll: function() {
        merklistDB._set({});
    },
    
    remove: function(product) {
        if(merklistDB._checkIfExists(product)){
            var data = merklistDB.getAll();
            var index = data.indexOf(product);
            if (index > -1) {
                data.splice(index, 1);
                merklistDB._set(data);
                //this.products = dataNew;
            }
            
        }
    },
}





require.config({
    paths: {
        'jquery': 'lib/jquery.min',
        'text': 'lib/text',
        'tpl': '../views/configuration'
    }
})
require(['jquery', 'text!tpl/step_table_row.ejs', 'text!tpl/seller_table_row.ejs'], function($, stepTableRowTpl, sellerTableRowTpl) {
    var Steps = {
        selectors: {
            table: '.js-bounty-table',
            tableBody: '.js-bounty-table-body'
        },
        getData: function() {
            return $.get('/steps');
        },
        addTableRow: function(item) {
            $(Steps.selectors.tableBody).append(_.template(stepTableRowTpl)(item));
        },
        buildTable: function(res) {
            _.each(res, function(item) {
                Steps.addTableRow(item);
            });
        },
        initialize: function() {
            Steps.getData().done(Steps.buildTable)
        }
    };

    var Sellers = {
        selectors: {
            tableBody: '.js-sellers-table'
        },
        addTableRow: function(item) {
            $(Sellers.selectors.tableBody).append(_.template(sellerTableRowTpl)(item));
        },
        buildTable: function(res) {
            _.each(res, function(item) {
                Sellers.addTableRow(item);
            })
        },
        getData: function() {
            return $.get('/sellers');
        },
        initialize: function() {
            Sellers.getData().done(Sellers.buildTable)
        }
    }
    Steps.initialize();
    Sellers.initialize();
});